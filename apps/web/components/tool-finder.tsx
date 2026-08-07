"use client";

import Link from "next/link";
import { FormEvent, useEffect, useRef, useState } from "react";
import {
  clearAssistantSession,
  getAssistantSessionHistory,
  setAssistantSession,
  type AssistantSessionContext,
} from "../lib/assistant-session";
import { parseSingleNumber } from "../lib/conversation";
import { buildPrefillQuery } from "../lib/prefill";

type MissingInput = { key: string; label: string; suffix: string | null };
type InputMeta = MissingInput;
type Match = {
  toolId: string;
  slug: string;
  title: string;
  description: string;
  confidence: number;
  extractedInputs: Record<string, number>;
  missingInputs: MissingInput[];
  inputMeta: InputMeta[];
  resultLabels: Record<string, string>;
};

type ChatLine = {
  id: number;
  role: "user" | "assistant";
  text: string;
};

type CalculationState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "success"; result: Record<string, unknown>; toolId: string };

const CHAT_CALCULATORS = new Set(["profit-margin", "discount-profit", "marketplace-net-profit"]);

const RESULT_SUFFIXES: Readonly<Record<string, string>> = {
  unitProfit: "TL",
  profitRatePercent: "%",
  marginPercent: "%",
  breakEvenPrice: "TL",
  discountedPrice: "TL",
  commissionCost: "TL",
  netProfit: "TL",
  netMarginPercent: "%",
};

function formatNumber(value: number): string {
  return new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 2 }).format(value);
}

function formatMetric(key: string, value: unknown): string {
  if (typeof value !== "number" || !Number.isFinite(value)) return String(value ?? "-");
  const suffix = RESULT_SUFFIXES[key];
  return suffix === "%" ? `%${formatNumber(value)}` : suffix ? `${formatNumber(value)} ${suffix}` : formatNumber(value);
}

export function ToolFinder() {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [match, setMatch] = useState<Match | null | undefined>(undefined);
  const [replyError, setReplyError] = useState<string | null>(null);
  const [contextHistory, setContextHistory] = useState<AssistantSessionContext[]>([]);
  const [calculation, setCalculation] = useState<CalculationState>({ status: "idle" });
  const [chat, setChat] = useState<ChatLine[]>([]);
  const nextChatIdRef = useRef(1);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setContextHistory(getAssistantSessionHistory());
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [chat, calculation.status]);

  function appendChat(role: ChatLine["role"], text: string) {
    const id = nextChatIdRef.current;
    nextChatIdRef.current += 1;
    setChat((current) => [...current, { id, role, text }]);
  }

  async function calculateInline(activeMatch: Match) {
    if (!CHAT_CALCULATORS.has(activeMatch.toolId)) return false;

    setCalculation({ status: "loading" });
    try {
      const response = await fetch("/api/calculate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ toolId: activeMatch.toolId, values: activeMatch.extractedInputs }),
      });
      const data = await response.json();
      if (!response.ok || !data.ok || !data.result || typeof data.result !== "object") {
        setCalculation({ status: "error", message: "Bu değerlerle hesaplama yapılamadı. Girdileri kontrol edin." });
        appendChat("assistant", "Bu değerlerle güvenli bir hesaplama yapamadım. Girdileri kontrol edip tekrar deneyin.");
        return true;
      }

      const result = data.result as Record<string, unknown>;
      setCalculation({ status: "success", result, toolId: activeMatch.toolId });
      setAssistantSession({
        toolId: activeMatch.toolId,
        toolTitle: activeMatch.title,
        inputs: activeMatch.extractedInputs,
      });
      setContextHistory(getAssistantSessionHistory());
      appendChat("assistant", `${activeMatch.title} hesabı tamamlandı. Sonucu aşağıdaki doğrulanmış hesap kartında görebilirsiniz.`);
      return true;
    } catch {
      setCalculation({ status: "error", message: "Hesaplama servisine ulaşılamadı." });
      appendChat("assistant", "Hesaplama servisine şu anda ulaşılamıyor. Tekrar deneyin.");
      return true;
    }
  }

  async function resolveMessage(text: string) {
    setLoading(true);
    setMatch(undefined);
    setCalculation({ status: "idle" });
    setReplyError(null);

    try {
      const response = await fetch("/api/find-tool", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ message: text, previousContexts: contextHistory }),
      });
      const data = await response.json();
      const nextMatch = response.ok && data.ok ? data.match as Match | null : null;
      setMatch(nextMatch);

      if (!nextMatch) {
        appendChat("assistant", "Bu ihtiyacı henüz güvenli şekilde bir hesaplama aracına bağlayamadım.");
        return;
      }

      if (nextMatch.missingInputs.length > 0) {
        const missing = nextMatch.missingInputs[0];
        appendChat("assistant", `${nextMatch.title} için ${missing.label}${missing.suffix ? ` (${missing.suffix})` : ""} bilgisini de yazın.`);
        return;
      }

      const handledInline = await calculateInline(nextMatch);
      if (!handledInline) {
        appendChat("assistant", `${nextMatch.title} bulundu. Bu hesap henüz sohbet motoruna taşınmadı; mevcut hesaplayıcı sayfasını kullanabilirsiniz.`);
      }
    } catch {
      setMatch(null);
      appendChat("assistant", "İsteğinizi analiz ederken bir bağlantı hatası oluştu.");
    } finally {
      setLoading(false);
    }
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = message.trim();
    if (text.length < 1) return;

    appendChat("user", text);
    setMessage("");

    if (match && match.missingInputs.length > 0) {
      const current = match.missingInputs[0];
      const value = parseSingleNumber(text);
      if (value === null) {
        setReplyError(`${current.label} için 0 veya daha büyük geçerli bir sayı yazın.`);
        appendChat("assistant", `${current.label} için geçerli bir sayı anlayamadım. Lütfen yalnız değeri veya değeri birimiyle yazın.`);
        return;
      }

      const nextMatch: Match = {
        ...match,
        extractedInputs: { ...match.extractedInputs, [current.key]: value },
        missingInputs: match.missingInputs.slice(1),
      };
      setMatch(nextMatch);
      setReplyError(null);

      if (nextMatch.missingInputs.length > 0) {
        const nextMissing = nextMatch.missingInputs[0];
        appendChat("assistant", `${nextMissing.label}${nextMissing.suffix ? ` (${nextMissing.suffix})` : ""} bilgisini de yazın.`);
        return;
      }

      const handledInline = await calculateInline(nextMatch);
      if (!handledInline) {
        appendChat("assistant", "Bilgiler tamamlandı. Bu araç için mevcut hesaplayıcı sayfasını açabilirsiniz.");
      }
      return;
    }

    if (text.length < 3) {
      appendChat("assistant", "Ne yapmak istediğinizi biraz daha açık yazın.");
      return;
    }

    await resolveMessage(text);
  }

  const latestContext = contextHistory.at(-1) ?? null;
  const extractedCount = match ? Object.keys(match.extractedInputs).length : 0;
  const query = match ? buildPrefillQuery(match.extractedInputs) : "";
  const href = match ? `/araclar/${match.slug}${query ? `?${query}` : ""}` : "#";
  const currentMissing = match?.missingInputs[0];

  function resetConversation() {
    clearAssistantSession();
    setContextHistory([]);
    setMessage("");
    setMatch(undefined);
    setReplyError(null);
    setCalculation({ status: "idle" });
    setChat([]);
    nextChatIdRef.current = 1;
  }

  return (
    <div id="assistant" className="chat-assistant">
      <div className="chat-window" aria-live="polite">
        {chat.length === 0 && (
          <div className="chat-empty">
            <strong>İşletme AI</strong>
            <p>Hesabı doğal dille anlatın. Eksik bilgiyi sorarım ve doğrulanmış hesap motorunu burada çalıştırırım.</p>
          </div>
        )}
        {chat.map((line) => (
          <div className={`chat-line chat-line-${line.role}`} key={line.id}>
            <span>{line.role === "user" ? "Siz" : "İşletme AI"}</span>
            <p>{line.text}</p>
          </div>
        ))}

        {match && calculation.status === "success" && (
          <div className="chat-calculation-card">
            <div className="chat-calculation-heading">
              <span>Doğrulanmış hesap</span>
              <strong>{match.title}</strong>
            </div>
            <div className="chat-used-inputs">
              {match.inputMeta
                .filter((input) => match.extractedInputs[input.key] !== undefined)
                .map((input) => (
                  <span key={input.key}>{input.label}: <b>{formatNumber(match.extractedInputs[input.key])}{input.suffix ? ` ${input.suffix}` : ""}</b></span>
                ))}
            </div>
            <div className="chat-result-grid">
              {Object.entries(calculation.result).map(([key, value]) => (
                <div key={key}>
                  <span>{match.resultLabels[key] ?? key}</span>
                  <strong>{formatMetric(key, value)}</strong>
                </div>
              ))}
            </div>
            <small>Sonuç AI tarafından tahmin edilmedi; deterministik hesaplama motoru tarafından üretildi.</small>
          </div>
        )}

        {calculation.status === "error" && <div className="finder-error" role="alert">{calculation.message}</div>}
        <div ref={chatEndRef} aria-hidden="true" />
      </div>

      <form className="finder chat-composer" onSubmit={onSubmit}>
        <input
          className="input"
          aria-label={currentMissing ? currentMissing.label : latestContext ? "Devam sorunuzu yazın" : "Ne hesaplamak istiyorsunuz?"}
          maxLength={500}
          onChange={(event) => setMessage(event.target.value)}
          placeholder={currentMissing
            ? `${currentMissing.label}${currentMissing.suffix ? ` (${currentMissing.suffix})` : ""}`
            : latestContext
              ? "Örn. Şimdi %10 indirim yaparsam?"
              : "Örn. Maliyetim 100 TL, 160 TL'ye satıyorum. Marjım ne?"}
          value={message}
        />
        <button className="button" disabled={loading || calculation.status === "loading" || message.trim().length < 1} type="submit">
          {loading || calculation.status === "loading" ? "Hesaplanıyor…" : "Gönder"}
        </button>
      </form>

      {replyError && <p className="finder-error" role="alert">{replyError}</p>}

      {match && !CHAT_CALCULATORS.has(match.toolId) && match.missingInputs.length === 0 && (
        <div className="result" role="status">
          <strong>{match.title}</strong>
          {extractedCount > 0 && <p>{extractedCount} alan hazır. Bu araç sohbet motoruna eklenene kadar mevcut hesaplayıcıyı kullanın.</p>}
          <Link className="button" href={href}>{extractedCount > 0 ? "Aracı doldur" : "Aracı aç"}</Link>
        </div>
      )}

      {(chat.length > 0 || latestContext) && (
        <button className="finder-reset" type="button" onClick={resetConversation}>Sohbeti temizle</button>
      )}
    </div>
  );
}

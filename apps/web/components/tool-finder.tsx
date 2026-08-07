"use client";

import Link from "next/link";
import { FormEvent, useEffect, useRef, useState } from "react";
import {
  clearAssistantSession,
  getAssistantSessionHistory,
  setAssistantSession,
  type AssistantSessionContext,
} from "../lib/assistant-session";
import { getChatSuggestions } from "../lib/chat-suggestions";
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

type ChatEntry =
  | {
      id: number;
      kind: "message";
      role: "user" | "assistant";
      text: string;
    }
  | {
      id: number;
      kind: "calculation";
      match: Match;
      result: Record<string, unknown>;
    };

type CalculationState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string };

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

const PRIMARY_RESULT_KEYS: Readonly<Record<string, readonly string[]>> = {
  "profit-margin": ["unitProfit", "marginPercent"],
  "discount-profit": ["discountedPrice", "unitProfit", "marginPercent"],
  "marketplace-net-profit": ["netProfit", "netMarginPercent"],
};

function formatNumber(value: number): string {
  return new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 2 }).format(value);
}

function formatMetric(key: string, value: unknown): string {
  if (typeof value !== "number" || !Number.isFinite(value)) return String(value ?? "-");
  const suffix = RESULT_SUFFIXES[key];
  return suffix === "%" ? `%${formatNumber(value)}` : suffix ? `${formatNumber(value)} ${suffix}` : formatNumber(value);
}

function primaryResultEntries(toolId: string, result: Record<string, unknown>) {
  const preferred = PRIMARY_RESULT_KEYS[toolId] ?? [];
  const entries = preferred
    .filter((key) => result[key] !== undefined)
    .slice(0, 2)
    .map((key) => [key, result[key]] as const);

  return entries.length > 0 ? entries : Object.entries(result).slice(0, 2);
}

export function ToolFinder() {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [match, setMatch] = useState<Match | null | undefined>(undefined);
  const [replyError, setReplyError] = useState<string | null>(null);
  const [contextHistory, setContextHistory] = useState<AssistantSessionContext[]>([]);
  const [calculation, setCalculation] = useState<CalculationState>({ status: "idle" });
  const [chat, setChat] = useState<ChatEntry[]>([]);
  const nextChatIdRef = useRef(1);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setContextHistory(getAssistantSessionHistory());
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [chat, calculation.status, loading]);

  function nextChatId() {
    const id = nextChatIdRef.current;
    nextChatIdRef.current += 1;
    return id;
  }

  function appendMessage(role: "user" | "assistant", text: string) {
    const id = nextChatId();
    setChat((current) => [...current, { id, kind: "message", role, text }]);
  }

  function appendCalculation(activeMatch: Match, result: Record<string, unknown>) {
    const id = nextChatId();
    setChat((current) => [...current, { id, kind: "calculation", match: activeMatch, result }]);
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
        appendMessage("assistant", "Bu değerlerle güvenli bir hesaplama yapamadım. Girdileri kontrol edip tekrar deneyin.");
        return true;
      }

      const result = data.result as Record<string, unknown>;
      setAssistantSession({
        toolId: activeMatch.toolId,
        toolTitle: activeMatch.title,
        inputs: activeMatch.extractedInputs,
      });
      setContextHistory(getAssistantSessionHistory());
      appendCalculation(activeMatch, result);
      setCalculation({ status: "idle" });
      return true;
    } catch {
      setCalculation({ status: "error", message: "Hesaplama servisine ulaşılamadı." });
      appendMessage("assistant", "Hesaplama servisine şu anda ulaşılamıyor. Tekrar deneyin.");
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
        appendMessage("assistant", "Bu ihtiyacı henüz güvenli şekilde bir hesaplama aracına bağlayamadım.");
        return;
      }

      if (nextMatch.missingInputs.length > 0) {
        const missing = nextMatch.missingInputs[0];
        appendMessage("assistant", `${nextMatch.title} için ${missing.label}${missing.suffix ? ` (${missing.suffix})` : ""} bilgisini de yazın.`);
        return;
      }

      const handledInline = await calculateInline(nextMatch);
      if (!handledInline) {
        appendMessage("assistant", `${nextMatch.title} bulundu. Bu hesap henüz sohbet motoruna taşınmadı; mevcut hesaplayıcı sayfasını kullanabilirsiniz.`);
      }
    } catch {
      setMatch(null);
      appendMessage("assistant", "İsteğinizi analiz ederken bir bağlantı hatası oluştu.");
    } finally {
      setLoading(false);
    }
  }

  async function processText(text: string) {
    if (loading || calculation.status === "loading") return;

    appendMessage("user", text);
    setReplyError(null);

    if (match && match.missingInputs.length > 0) {
      const current = match.missingInputs[0];
      const value = parseSingleNumber(text);
      if (value === null) {
        setReplyError(`${current.label} için 0 veya daha büyük geçerli bir sayı yazın.`);
        appendMessage("assistant", `${current.label} için geçerli bir sayı anlayamadım. Lütfen yalnız değeri veya değeri birimiyle yazın.`);
        return;
      }

      const nextMatch: Match = {
        ...match,
        extractedInputs: { ...match.extractedInputs, [current.key]: value },
        missingInputs: match.missingInputs.slice(1),
      };
      setMatch(nextMatch);

      if (nextMatch.missingInputs.length > 0) {
        const nextMissing = nextMatch.missingInputs[0];
        appendMessage("assistant", `${nextMissing.label}${nextMissing.suffix ? ` (${nextMissing.suffix})` : ""} bilgisini de yazın.`);
        return;
      }

      const handledInline = await calculateInline(nextMatch);
      if (!handledInline) {
        appendMessage("assistant", "Bilgiler tamamlandı. Bu araç için mevcut hesaplayıcı sayfasını açabilirsiniz.");
      }
      return;
    }

    if (text.length < 3) {
      appendMessage("assistant", "Ne yapmak istediğinizi biraz daha açık yazın.");
      return;
    }

    await resolveMessage(text);
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = message.trim();
    if (text.length < 1) return;
    setMessage("");
    await processText(text);
  }

  async function runSuggestion(text: string) {
    setMessage("");
    await processText(text);
  }

  const latestContext = contextHistory.at(-1) ?? null;
  const extractedCount = match ? Object.keys(match.extractedInputs).length : 0;
  const query = match ? buildPrefillQuery(match.extractedInputs) : "";
  const href = match ? `/araclar/${match.slug}${query ? `?${query}` : ""}` : "#";
  const currentMissing = match?.missingInputs[0];
  const latestCalculationId = [...chat].reverse().find((entry) => entry.kind === "calculation")?.id ?? null;
  const isThinking = loading || calculation.status === "loading";

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
      <div className="chat-shell">
        <div className="chat-window" aria-live="polite">
          {chat.length === 0 && (
            <div className="chat-empty">
              <strong>İşletme AI</strong>
              <p>Hesabı doğal dille anlatın. Eksik bilgiyi sorarım ve doğrulanmış hesap motorunu burada çalıştırırım.</p>
            </div>
          )}

          {chat.map((entry) => {
            if (entry.kind === "message") {
              return (
                <div className={`chat-line chat-line-${entry.role}`} key={entry.id}>
                  <span>{entry.role === "user" ? "Siz" : "İşletme AI"}</span>
                  <p>{entry.text}</p>
                </div>
              );
            }

            const suggestions = entry.id === latestCalculationId ? getChatSuggestions(entry.match.toolId) : [];
            const primaryResults = primaryResultEntries(entry.match.toolId, entry.result);

            return (
              <div className="chat-calculation-message" key={entry.id}>
                <span className="chat-assistant-label">İşletme AI</span>
                <div className="chat-calculation-card">
                  <div className="chat-calculation-heading">
                    <span>✓ Hesaplandı</span>
                    <strong>{entry.match.title}</strong>
                  </div>

                  <div className="chat-primary-results">
                    {primaryResults.map(([key, value]) => (
                      <div key={key}>
                        <span>{entry.match.resultLabels[key] ?? key}</span>
                        <strong>{formatMetric(key, value)}</strong>
                      </div>
                    ))}
                  </div>

                  <details className="chat-result-details">
                    <summary>Detayı aç</summary>
                    <div className="chat-used-inputs">
                      {entry.match.inputMeta
                        .filter((input) => entry.match.extractedInputs[input.key] !== undefined)
                        .map((input) => (
                          <span key={input.key}>{input.label}: <b>{formatNumber(entry.match.extractedInputs[input.key])}{input.suffix ? ` ${input.suffix}` : ""}</b></span>
                        ))}
                    </div>
                    <div className="chat-result-grid">
                      {Object.entries(entry.result).map(([key, value]) => (
                        <div key={key}>
                          <span>{entry.match.resultLabels[key] ?? key}</span>
                          <strong>{formatMetric(key, value)}</strong>
                        </div>
                      ))}
                    </div>
                    <small>Sonuç AI tarafından tahmin edilmedi; deterministik hesaplama motoru tarafından üretildi.</small>
                  </details>

                  {suggestions.length > 0 && (
                    <div className="chat-suggestions" aria-label="Sonraki hesap önerileri">
                      <span>Şimdi ne yapmak istersiniz?</span>
                      <div>
                        {suggestions.map((suggestion) => (
                          <button
                            type="button"
                            key={suggestion.message}
                            disabled={isThinking}
                            onClick={() => void runSuggestion(suggestion.message)}
                          >
                            {suggestion.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {isThinking && (
            <div className="chat-typing" role="status">
              <span>İşletme AI yazıyor</span>
              <i />
              <i />
              <i />
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
          <button className="button" disabled={isThinking || message.trim().length < 1} type="submit">
            {isThinking ? "Bekleyin…" : "Gönder"}
          </button>
        </form>
      </div>

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

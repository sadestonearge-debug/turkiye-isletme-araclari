"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import {
  clearAssistantSession,
  getAssistantSessionHistory,
  type AssistantSessionContext,
} from "../lib/assistant-session";
import { parseSingleNumber } from "../lib/conversation";
import { buildPrefillQuery } from "../lib/prefill";

type MissingInput = { key: string; label: string; suffix: string | null };
type Match = {
  toolId: string;
  slug: string;
  title: string;
  description: string;
  confidence: number;
  extractedInputs: Record<string, number>;
  missingInputs: MissingInput[];
};

export function ToolFinder() {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [match, setMatch] = useState<Match | null | undefined>(undefined);
  const [replyError, setReplyError] = useState<string | null>(null);
  const [contextHistory, setContextHistory] = useState<AssistantSessionContext[]>([]);

  useEffect(() => {
    setContextHistory(getAssistantSessionHistory());
  }, []);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (message.trim().length < 1) return;

    if (match && match.missingInputs.length > 0) {
      const current = match.missingInputs[0];
      const value = parseSingleNumber(message);
      if (value === null) {
        setReplyError(`${current.label} için 0 veya daha büyük geçerli bir sayı yazın.`);
        return;
      }

      setMatch({
        ...match,
        extractedInputs: { ...match.extractedInputs, [current.key]: value },
        missingInputs: match.missingInputs.slice(1),
      });
      setMessage("");
      setReplyError(null);
      return;
    }

    if (message.trim().length < 3) return;
    setLoading(true);
    setMatch(undefined);
    setReplyError(null);

    try {
      const response = await fetch("/api/find-tool", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ message, previousContexts: contextHistory }),
      });
      const data = await response.json();
      setMatch(response.ok && data.ok ? data.match : null);
      setMessage("");
    } catch {
      setMatch(null);
    } finally {
      setLoading(false);
    }
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
  }

  function clearPreviousContext() {
    clearAssistantSession();
    setContextHistory([]);
    setMatch(undefined);
    setReplyError(null);
  }

  return (
    <div id="assistant">
      {latestContext && (
        <div className="assistant-session-context" role="status">
          <div>
            <span>Geçici hesap zinciri · {contextHistory.length}/3</span>
            <strong>{latestContext.toolTitle}</strong>
            <small>Son {contextHistory.length} doğrulanmış hesap girdisi bağlamda. Yeni sayı türetilmez; yalnız uygun eski değerler yeniden kullanılabilir.</small>
            {contextHistory.length > 1 && (
              <div className="assistant-context-chain" aria-label="Geçici hesap zinciri">
                {contextHistory.map((context, index) => (
                  <span key={`${context.toolId}-${index}`}>{index + 1}. {context.toolTitle}</span>
                ))}
              </div>
            )}
          </div>
          <button type="button" onClick={clearPreviousContext}>Bağlamı temizle</button>
        </div>
      )}

      <form className="finder" onSubmit={onSubmit}>
        <input
          className="input"
          aria-label={currentMissing ? currentMissing.label : latestContext ? "Devam sorunuzu yazın" : "Ne hesaplamak istiyorsunuz?"}
          maxLength={500}
          onChange={(event) => setMessage(event.target.value)}
          placeholder={currentMissing
            ? `${currentMissing.label}${currentMissing.suffix ? ` (${currentMissing.suffix})` : ""}`
            : latestContext
              ? "Örn. Şimdi komisyon %20 olursa net kârım ne olur?"
              : "Örn. Maliyetim 100 TL, 160 TL'ye satıyorum. Marjım ne?"}
          value={message}
        />
        <button className="button" disabled={loading || message.trim().length < 1} type="submit">
          {loading ? "Analiz ediliyor…" : currentMissing ? "Yanıtla" : latestContext ? "Devam et" : "AI ile analiz et"}
        </button>
      </form>

      {replyError && <p className="finder-error" role="alert">{replyError}</p>}

      {match === null && (
        <div className="result" role="status">
          Bu ihtiyaç için henüz uygun bir aracımız yok. Aşağıdaki araçlardan birini seçebilirsiniz.
        </div>
      )}

      {match && (
        <div className="result" role="status">
          <span>{latestContext ? "Devam sorusu için uygun araç" : "Size uygun araç"}</span>
          <strong>{match.title}</strong>
          <p>{match.description}</p>

          {currentMissing ? (
            <div className="conversation-prompt">
              <span>Bir bilgi daha gerekiyor</span>
              <b>{currentMissing.label}{currentMissing.suffix ? ` (${currentMissing.suffix})` : ""} nedir?</b>
              <small>AI yalnız eksik bilgiyi istiyor; hesaplama henüz yapılmayacak.</small>
            </div>
          ) : (
            <>
              {extractedCount > 0 && <p>Gerekli bilgiler tamamlandı. {extractedCount} alan hesaplayıcıya taşınacak.</p>}
              <Link className="button" href={href}>{extractedCount > 0 ? "Aracı doldur" : "Aracı aç"}</Link>
            </>
          )}

          <button className="finder-reset" type="button" onClick={resetConversation}>Baştan başla</button>
        </div>
      )}
    </div>
  );
}

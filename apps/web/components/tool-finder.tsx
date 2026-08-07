"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { buildPrefillQuery } from "../lib/prefill";

type Match = {
  slug: string;
  title: string;
  description: string;
  confidence: number;
  extractedInputs: Record<string, number>;
  missingInputs: string[];
};

export function ToolFinder() {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [match, setMatch] = useState<Match | null | undefined>(undefined);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (message.trim().length < 3) return;
    setLoading(true);
    setMatch(undefined);

    try {
      const response = await fetch("/api/find-tool", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ message }),
      });
      const data = await response.json();
      setMatch(response.ok && data.ok ? data.match : null);
    } catch {
      setMatch(null);
    } finally {
      setLoading(false);
    }
  }

  const extractedCount = match ? Object.keys(match.extractedInputs).length : 0;
  const query = match ? buildPrefillQuery(match.extractedInputs) : "";
  const href = match ? `/araclar/${match.slug}${query ? `?${query}` : ""}` : "#";

  return (
    <div>
      <form className="finder" onSubmit={onSubmit}>
        <input
          className="input"
          aria-label="Ne hesaplamak istiyorsunuz?"
          maxLength={500}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="Örn. Maliyetim 100 TL, 160 TL'ye satıyorum. Marjım ne?"
          value={message}
        />
        <button className="button" disabled={loading || message.trim().length < 3} type="submit">
          {loading ? "Analiz ediliyor…" : "AI ile analiz et"}
        </button>
      </form>

      {match === null && (
        <div className="result" role="status">
          Bu ihtiyaç için henüz uygun bir aracımız yok. Aşağıdaki araçlardan birini seçebilirsiniz.
        </div>
      )}

      {match && (
        <div className="result" role="status">
          <span>Size uygun araç</span>
          <strong>{match.title}</strong>
          <p>{match.description}</p>
          {extractedCount > 0 && (
            <p>AI mesajınızdan {extractedCount} sayısal alan çıkardı. Aracı açtığınızda bu değerler önceden doldurulacak.</p>
          )}
          {match.missingInputs.length > 0 && (
            <p>Eksik alanları hesaplama sayfasında siz tamamlayacaksınız.</p>
          )}
          <Link className="button" href={href}>{extractedCount > 0 ? "Aracı doldur" : "Aracı aç"}</Link>
        </div>
      )}
    </div>
  );
}

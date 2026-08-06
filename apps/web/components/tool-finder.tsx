"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

type Match = { slug: string; title: string; description: string; confidence: number };

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

  return (
    <div>
      <form className="finder" onSubmit={onSubmit}>
        <input
          className="input"
          aria-label="Ne hesaplamak istiyorsunuz?"
          maxLength={500}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="Örn. Ürünümü kaça satmalıyım?"
          value={message}
        />
        <button className="button" disabled={loading || message.trim().length < 3} type="submit">
          {loading ? "Bulunuyor…" : "Aracı bul"}
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
          <Link className="button" href={`/araclar/${match.slug}`}>Aracı aç</Link>
        </div>
      )}
    </div>
  );
}

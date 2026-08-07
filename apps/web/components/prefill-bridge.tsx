"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useMemo } from "react";

type PrefillBridgeProps = {
  allowedKeys: readonly string[];
};

export function PrefillBridge({ allowedKeys }: PrefillBridgeProps) {
  const searchParams = useSearchParams();
  const query = searchParams.toString();

  const entries = useMemo(() => {
    const safe: [string, number][] = [];
    for (const key of allowedKeys) {
      const raw = searchParams.get(key);
      if (raw === null || raw.trim() === "") continue;
      const value = Number(raw);
      if (!Number.isFinite(value) || value < 0) continue;
      safe.push([key, value]);
    }
    return safe;
  }, [allowedKeys, query, searchParams]);

  useEffect(() => {
    for (const [key, value] of entries) {
      const input = document.getElementById(key);
      if (!(input instanceof HTMLInputElement)) continue;
      input.value = String(value);
    }
  }, [entries]);

  if (entries.length === 0) return null;

  return (
    <div className="prefill-notice" role="status">
      <strong>AI mesajınızdaki {entries.length} alanı doldurdu.</strong>
      <span>Değerleri kontrol edin, eksik alanları tamamlayın ve ardından hesaplayın.</span>
    </div>
  );
}

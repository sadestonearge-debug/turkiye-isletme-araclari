"use client";

import { useEffect } from "react";

type PrefillBridgeProps = {
  values: Record<string, number>;
};

export function PrefillBridge({ values }: PrefillBridgeProps) {
  const entries = Object.entries(values);

  useEffect(() => {
    for (const [key, value] of entries) {
      const input = document.getElementById(key);
      if (!(input instanceof HTMLInputElement)) continue;
      input.value = String(value);
    }
  }, [values]);

  if (entries.length === 0) return null;

  return (
    <div className="prefill-notice" role="status">
      <strong>AI mesajınızdaki {entries.length} alanı doldurdu.</strong>
      <span>Değerleri kontrol edin, eksik alanları tamamlayın ve ardından hesaplayın.</span>
    </div>
  );
}

"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo } from "react";

type PrefillField = {
  key: string;
  label: string;
  suffix?: string;
};

type PrefillBridgeProps = {
  fields: readonly PrefillField[];
};

export function PrefillBridge({ fields }: PrefillBridgeProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const query = searchParams.toString();

  const entries = useMemo(() => {
    const safe: Array<PrefillField & { value: number }> = [];
    for (const field of fields) {
      const raw = searchParams.get(field.key);
      if (raw === null || raw.trim() === "") continue;
      const value = Number(raw);
      if (!Number.isFinite(value) || value < 0) continue;
      safe.push({ ...field, value });
    }
    return safe;
  }, [fields, query, searchParams]);

  useEffect(() => {
    for (const entry of entries) {
      const input = document.getElementById(entry.key);
      if (!(input instanceof HTMLInputElement)) continue;
      input.value = String(entry.value);
    }
  }, [entries]);

  function clearPrefills() {
    for (const entry of entries) {
      const input = document.getElementById(entry.key);
      if (!(input instanceof HTMLInputElement)) continue;
      input.value = "";
    }
    router.replace(pathname, { scroll: false });
  }

  if (entries.length === 0) return null;

  return (
    <div className="prefill-notice" role="status">
      <div className="prefill-heading-row">
        <div>
          <strong>AI mesajınızdaki {entries.length} alanı doldurdu.</strong>
          <span>Değerleri kontrol edin, eksik alanları tamamlayın ve ardından hesaplayın.</span>
        </div>
        <button className="prefill-clear" type="button" onClick={clearPrefills}>Temizle</button>
      </div>
      <ul className="prefill-list" aria-label="AI tarafından doldurulan alanlar">
        {entries.map((entry) => (
          <li key={entry.key}>
            <span>{entry.label}</span>
            <strong>{entry.value}{entry.suffix ? ` ${entry.suffix}` : ""}</strong>
          </li>
        ))}
      </ul>
    </div>
  );
}

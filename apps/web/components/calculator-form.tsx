"use client";

import { FormEvent, useState } from "react";
import type { ToolPageDefinition } from "../lib/tools";

type ResultState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "success"; result: Record<string, unknown> };

function formatValue(key: string, value: unknown): string {
  if (typeof value !== "number") return String(value);
  const isPercent = key.toLowerCase().includes("percent") || key.toLowerCase().includes("margin") || key.toLowerCase().includes("rate");
  const isMonths = key.toLowerCase().includes("months");
  if (isMonths) return `${value} ay`;
  if (isPercent) return `%${new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 2 }).format(value)}`;
  return `${new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 2 }).format(value)} TL`;
}

export function CalculatorForm({ tool }: { tool: ToolPageDefinition }) {
  const [state, setState] = useState<ResultState>({ status: "idle" });

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState({ status: "loading" });

    const formData = new FormData(event.currentTarget);
    const values = Object.fromEntries(
      tool.inputs.map((input) => {
        const raw = formData.get(input.key);
        return [input.key, raw === "" || raw === null ? undefined : Number(raw)];
      }),
    );

    try {
      const response = await fetch("/api/calculate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ toolId: tool.id, values }),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) {
        setState({ status: "error", message: "Girdiğiniz değerleri kontrol edin ve tekrar deneyin." });
        return;
      }
      setState({ status: "success", result: data.result as Record<string, unknown> });
    } catch {
      setState({ status: "error", message: "Hesaplama şu anda tamamlanamadı. Lütfen tekrar deneyin." });
    }
  }

  return (
    <div className="tool-panel">
      <form className="form-grid" onSubmit={onSubmit}>
        {tool.inputs.map((input) => (
          <div className="field" key={input.key}>
            <label htmlFor={input.key}>{input.label}</label>
            <input
              className="input"
              id={input.key}
              name={input.key}
              inputMode="decimal"
              type="number"
              step="any"
              min="0"
              placeholder={input.placeholder}
              required={input.key !== "packagingCost" && input.key !== "extraCost" && input.key !== "shippingCost" && input.key !== "adCost" && input.key !== "wastePercent"}
            />
          </div>
        ))}
        <button className="button" disabled={state.status === "loading"} type="submit">
          {state.status === "loading" ? "Hesaplanıyor…" : "Hesapla"}
        </button>
      </form>

      {state.status === "error" && <div className="result" role="alert">{state.message}</div>}

      {state.status === "success" && (
        <div className="result" aria-live="polite">
          {Object.entries(state.result).map(([key, value]) => (
            <p key={key}>
              <span>{tool.resultLabels[key] ?? key}</span>
              <strong>{formatValue(key, value)}</strong>
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

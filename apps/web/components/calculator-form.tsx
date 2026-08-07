"use client";

import Link from "next/link";
import { FormEvent, useRef, useState } from "react";
import { setAssistantSession } from "../lib/assistant-session";
import {
  formatNumber,
  formatValue,
  getDecisionCopy,
  getScenarioRequests,
  nextTools,
} from "../lib/decision-support";
import type { ToolPageDefinition } from "../lib/tools";

type ResultState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "success"; result: Record<string, unknown>; inputs: Record<string, number | undefined> };

type Scenario = {
  label: string;
  value: string;
  detail?: string;
  detailNumeric?: number;
  delta?: number;
  deltaKey: string;
  current: boolean;
};

type AiExplanation = {
  summary: string;
  caution: string;
};

function isPercentageKey(key: string): boolean {
  const lower = key.toLowerCase();
  return lower.includes("percent") || lower.includes("margin") || lower.includes("rate");
}

function formatDelta(value: number | undefined, key: string): string | null {
  if (value === undefined || Math.abs(value) < 0.005) return null;
  const sign = value > 0 ? "+" : "";
  if (isPercentageKey(key)) return `${sign}${formatNumber(value)} puan`;
  if (key.toLowerCase().includes("months")) return `${sign}${formatNumber(value)} ay`;
  return `${sign}${formatNumber(value)} TL`;
}

async function calculate(toolId: string, values: Record<string, number | undefined>) {
  const response = await fetch("/api/calculate", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ toolId, values }),
  });
  const data = await response.json();
  if (!response.ok || !data.ok) throw new Error("calculation_failed");
  return data.result as Record<string, unknown>;
}

function ScenarioChart({ scenarios }: { scenarios: Scenario[] }) {
  if (scenarios.length !== 3 || scenarios.some((scenario) => scenario.detailNumeric === undefined)) return null;
  const values = scenarios.map((scenario) => scenario.detailNumeric as number);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const spread = Math.max(max - min, 1);
  const xs = [28, 150, 272];
  const ys = values.map((value) => 88 - ((value - min) / spread) * 58);
  const points = xs.map((x, index) => `${x},${ys[index]}`).join(" ");

  return (
    <div className="scenario-chart" aria-label="Fiyat değişimine göre kâr marjı grafiği">
      <svg viewBox="0 0 300 116" role="img" aria-labelledby="scenario-chart-title">
        <title id="scenario-chart-title">Fiyat değişimine göre kâr marjı</title>
        <line x1="28" y1="94" x2="272" y2="94" className="chart-axis" />
        <polyline points={points} className="chart-line" />
        {scenarios.map((scenario, index) => (
          <g key={scenario.label}>
            <circle cx={xs[index]} cy={ys[index]} r="4.5" className={scenario.current ? "chart-point chart-point-current" : "chart-point"} />
            <text x={xs[index]} y="110" textAnchor="middle" className="chart-label">{index === 0 ? "−%10" : index === 1 ? "Mevcut" : "+%10"}</text>
          </g>
        ))}
      </svg>
    </div>
  );
}

function scenarioHeading(toolId: string): { kicker: string; title: string } {
  switch (toolId) {
    case "profit-margin": return { kicker: "Fiyat senaryosu", title: "Fiyat değişirse marj ne olur?" };
    case "target-margin-sale-price": return { kicker: "Hedef senaryosu", title: "Marj hedefi değişirse fiyat ne olur?" };
    case "discount-profit": return { kicker: "İndirim senaryosu", title: "İndirim oranı değişirse sonuç ne olur?" };
    case "commission-sale-price": return { kicker: "Komisyon senaryosu", title: "Komisyon değişirse gereken fiyat ne olur?" };
    case "break-even-revenue": return { kicker: "Katkı marjı senaryosu", title: "Katkı marjı değişirse başa baş ciro ne olur?" };
    case "portion-cost": return { kicker: "Maliyet senaryosu", title: "Malzeme maliyeti değişirse porsiyon maliyeti ne olur?" };
    case "marketplace-net-profit": return { kicker: "Fiyat senaryosu", title: "Satış fiyatı değişirse net sonuç ne olur?" };
    case "machine-payback": return { kicker: "Katkı senaryosu", title: "Aylık katkı değişirse geri ödeme süresi ne olur?" };
    default: return { kicker: "Senaryo", title: "Farklı durumda sonuç ne olur?" };
  }
}

export function CalculatorForm({ tool }: { tool: ToolPageDefinition }) {
  const [state, setState] = useState<ResultState>({ status: "idle" });
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [aiExplanation, setAiExplanation] = useState<AiExplanation | null>(null);
  const requestSequence = useRef(0);

  async function requestAiExplanation(
    sequence: number,
    inputs: Record<string, number | undefined>,
    result: Record<string, unknown>,
  ) {
    try {
      const response = await fetch("/api/explain-result", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ toolId: tool.id, inputs, result }),
      });
      const data = await response.json();
      if (requestSequence.current !== sequence) return;
      if (response.ok && data.ok && data.available && data.source === "gemini") {
        setAiExplanation(data.explanation as AiExplanation);
      }
    } catch {
      // AI explanation is optional. Deterministic results remain fully usable.
    }
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const sequence = requestSequence.current + 1;
    requestSequence.current = sequence;
    setState({ status: "loading" });
    setScenarios([]);
    setAiExplanation(null);

    const formData = new FormData(event.currentTarget);
    const values = Object.fromEntries(
      tool.inputs.map((input) => {
        const raw = formData.get(input.key);
        return [input.key, raw === "" || raw === null ? undefined : Number(raw)];
      }),
    ) as Record<string, number | undefined>;

    try {
      const result = await calculate(tool.id, values);
      if (requestSequence.current !== sequence) return;
      setState({ status: "success", result, inputs: values });

      const verifiedInputs = Object.fromEntries(
        Object.entries(values).filter((entry): entry is [string, number] => typeof entry[1] === "number" && Number.isFinite(entry[1])),
      );
      setAssistantSession({ toolId: tool.id, toolTitle: tool.title, inputs: verifiedInputs });

      void requestAiExplanation(sequence, values, result);

      const requests = getScenarioRequests(tool.id, values);
      if (requests.length > 0) {
        const calculated = await Promise.all(
          requests.map(async (request) => ({ request, result: await calculate(request.toolId, request.values) })),
        );
        if (requestSequence.current !== sequence) return;
        const currentItem = calculated.find(({ request }) => request.current);
        const currentDetail = currentItem ? Number(currentItem.result[currentItem.request.detailKey] ?? currentItem.request.values[currentItem.request.detailKey]) : undefined;

        setScenarios(calculated.map(({ request, result: scenarioResult }) => {
          const primaryRaw = scenarioResult[request.primaryKey] ?? request.values[request.primaryKey];
          const detailRaw = scenarioResult[request.detailKey] ?? request.values[request.detailKey];
          const detailNumeric = typeof detailRaw === "number" ? detailRaw : undefined;
          return {
            label: request.label,
            value: formatValue(request.primaryKey, primaryRaw),
            detail: request.detailKey !== request.primaryKey ? `${tool.resultLabels[request.detailKey] ?? "Sonuç"}: ${formatValue(request.detailKey, detailRaw)}` : undefined,
            detailNumeric,
            delta: detailNumeric !== undefined && currentDetail !== undefined ? detailNumeric - currentDetail : undefined,
            deltaKey: request.detailKey,
            current: request.current,
          };
        }));
      }
    } catch {
      if (requestSequence.current === sequence) {
        setState({ status: "error", message: "Hesaplama şu anda tamamlanamadı. Girdiğiniz değerleri kontrol edip tekrar deneyin." });
      }
    }
  }

  const nextTool = nextTools[tool.id];
  const decision = state.status === "success" ? getDecisionCopy(tool.id, state.result) : null;
  const heading = scenarioHeading(tool.id);

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

      {state.status === "success" && decision && (
        <div className="decision-results" aria-live="polite">
          <div className={`decision-banner decision-${decision.tone}`}>
            <span className="decision-kicker">Hesap sonucu</span>
            <strong>{decision.title}</strong>
            <p>{decision.body}</p>
          </div>

          <div className="metric-grid">
            {Object.entries(state.result).map(([key, value]) => (
              <div className="metric-card" key={key}>
                <span>{tool.resultLabels[key] ?? key}</span>
                <strong>{formatValue(key, value)}</strong>
              </div>
            ))}
          </div>

          {aiExplanation && (
            <aside className="ai-explanation" aria-label="Gemini AI yorumu">
              <span className="decision-kicker">AI yorumu · Gemini</span>
              <strong>{aiExplanation.summary}</strong>
              <p>{aiExplanation.caution}</p>
              <small>AI, doğrulanmış hesap sonucunu açıklar; hesaplamayı değiştirmez.</small>
            </aside>
          )}

          {scenarios.length > 0 && (
            <div className="scenario-block">
              <div className="result-heading">
                <div>
                  <span className="decision-kicker">{heading.kicker}</span>
                  <h3>{heading.title}</h3>
                </div>
              </div>
              <div className="scenario-grid">
                {scenarios.map((scenario) => {
                  const delta = formatDelta(scenario.delta, scenario.deltaKey);
                  const directional = isPercentageKey(scenario.deltaKey);
                  const deltaClass = directional
                    ? scenario.delta && scenario.delta > 0 ? "delta-positive" : "delta-negative"
                    : "delta-neutral";
                  return (
                    <div className={`scenario-card${scenario.current ? " scenario-current" : ""}`} key={scenario.label}>
                      <span>{scenario.label}</span>
                      <strong>{scenario.value}</strong>
                      {scenario.detail && <small>{scenario.detail}</small>}
                      {scenario.current ? <em className="delta-neutral">Mevcut</em> : delta && <em className={deltaClass}>{delta}</em>}
                    </div>
                  );
                })}
              </div>
              {tool.id === "profit-margin" && <ScenarioChart scenarios={scenarios} />}
            </div>
          )}

          <Link className="assistant-continue" href="/#assistant">
            <span className="decision-kicker">AI ile devam et</span>
            <strong>Bu hesabın üzerinden yeni bir soru sor</strong>
            <p>Örneğin “Şimdi %10 indirim yaparsam?” diyebilirsiniz. Bağlam yalnız bu tarayıcı oturumunda tutulur.</p>
          </Link>

          {nextTool && (
            <Link className="next-tool" href={`/araclar/${nextTool.slug}`}>
              <div>
                <span className="decision-kicker">Sonraki adım</span>
                <strong>{nextTool.question}</strong>
                <p>{nextTool.detail}</p>
                <span className="next-tool-action">{nextTool.title} →</span>
              </div>
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

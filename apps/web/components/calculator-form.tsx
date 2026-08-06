"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import type { ToolPageDefinition } from "../lib/tools";

type ResultState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "success"; result: Record<string, unknown>; inputs: Record<string, number | undefined> };

type Scenario = {
  label: string;
  value: string;
  detail: string;
  margin: number;
  delta: number;
};

const nextTools: Record<string, { slug: string; title: string; detail: string; question: string }> = {
  "profit-margin": {
    slug: "iskonto-sonrasi-kar-hesaplama",
    title: "İskonto sonrası kârı kontrol et",
    question: "İndirim yapmayı düşünüyor musunuz?",
    detail: "Bu fiyat üzerinden kampanya yaptığınızda marjınızın ne kadar değişeceğini görün.",
  },
  "target-margin-sale-price": {
    slug: "kar-marji-hesaplama",
    title: "Gerçek kâr marjını kontrol et",
    question: "Bulduğunuz fiyat hedefinizi karşılıyor mu?",
    detail: "Satış fiyatının maliyetinize göre oluşturduğu gerçek marjı doğrulayın.",
  },
  "discount-profit": {
    slug: "kar-marji-hesaplama",
    title: "Normal satış marjını karşılaştır",
    question: "İndirim öncesi durumu görmek ister misiniz?",
    detail: "Liste fiyatınızla gerçek kâr marjınızı hesaplayıp indirimli sonuçla karşılaştırın.",
  },
  "commission-sale-price": {
    slug: "pazaryeri-net-kar-hesaplama",
    title: "Pazaryeri net kârını hesapla",
    question: "Komisyon dışında başka giderleriniz de var mı?",
    detail: "Ürün, kargo ve reklam maliyetlerini de ekleyerek gerçek net sonucu görün.",
  },
  "break-even-revenue": {
    slug: "makine-amortisman-hesaplama",
    title: "Yatırım geri dönüşünü hesapla",
    question: "Yeni bir ekipman yatırımı planlıyor musunuz?",
    detail: "Yatırımın aylık net katkıyla kaç ayda kendini ödeyeceğini karşılaştırın.",
  },
  "portion-cost": {
    slug: "satis-fiyati-hesaplama",
    title: "Porsiyona satış fiyatı belirle",
    question: "Bu porsiyonu kaça satmanız gerektiğini biliyor musunuz?",
    detail: "Bulduğunuz maliyetten hedef marjınıza uygun satış fiyatını oluşturun.",
  },
  "marketplace-net-profit": {
    slug: "komisyon-dahil-satis-fiyati-hesaplama",
    title: "Komisyon dahil satış fiyatını bul",
    question: "Net kazanç hedefinizi korumak ister misiniz?",
    detail: "Kesintilerden sonra hedeflediğiniz net tutarı bırakacak satış fiyatını hesaplayın.",
  },
  "machine-payback": {
    slug: "basa-bas-ciro-hesaplama",
    title: "Başa baş cironuzu hesapla",
    question: "Yatırımı işletmenizin genel giderleriyle birlikte görmek ister misiniz?",
    detail: "Aylık sabit giderlerinizi karşılamak için gereken minimum ciroyu hesaplayın.",
  },
};

function formatNumber(value: number): string {
  return new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 2 }).format(value);
}

function formatValue(key: string, value: unknown): string {
  if (typeof value !== "number") return String(value);
  const isPercent = key.toLowerCase().includes("percent") || key.toLowerCase().includes("margin") || key.toLowerCase().includes("rate");
  const isMonths = key.toLowerCase().includes("months");
  if (isMonths) return `${formatNumber(value)} ay`;
  if (isPercent) return `%${formatNumber(value)}`;
  return `${formatNumber(value)} TL`;
}

function formatDelta(value: number): string {
  if (Math.abs(value) < 0.005) return "Mevcut";
  return `${value > 0 ? "+" : ""}${formatNumber(value)} puan`;
}

function getDecisionCopy(toolId: string, result: Record<string, unknown>): { title: string; body: string; tone: "positive" | "neutral" | "warning" } {
  if (toolId === "profit-margin") {
    const profit = Number(result.unitProfit);
    const margin = Number(result.marginPercent);
    if (Number.isFinite(profit) && profit < 0) {
      return {
        title: "Bu fiyat maliyetinizi karşılamıyor",
        body: `Birim sonuç ${formatValue("unitProfit", profit)} ve marj ${formatValue("marginPercent", margin)}. Satış fiyatını veya maliyet yapınızı yeniden değerlendirmeniz gerekir.`,
        tone: "warning",
      };
    }
    if (Number.isFinite(profit) && profit === 0) {
      return {
        title: "Başa baş noktasındasınız",
        body: "Bu fiyat doğrudan birim kâr üretmiyor. Vergi, komisyon, kargo veya diğer giderler varsa gerçek sonuç negatife dönebilir.",
        tone: "neutral",
      };
    }
    return {
      title: "Kârlı satış",
      body: `Birim kârınız ${formatValue("unitProfit", profit)}. Mevcut satış fiyatı maliyetinizin üzerindedir; kâr marjınız ${formatValue("marginPercent", margin)}. Marjın yeterliliği sektörünüze ve diğer giderlerinize bağlıdır.`,
      tone: "positive",
    };
  }

  if (toolId === "marketplace-net-profit") {
    const profit = Number(result.netProfit);
    const margin = Number(result.netMarginPercent);
    return profit < 0
      ? { title: "Bu satış senaryosu zarar üretiyor", body: `Komisyon ve diğer giderlerden sonra net sonuç ${formatValue("netProfit", profit)}. Fiyatı veya maliyetleri yeniden değerlendirin.`, tone: "warning" }
      : { title: "Satış sonrası net kâr pozitif", body: `Hesaplanan net kâr ${formatValue("netProfit", profit)}, net marj ise ${formatValue("netMarginPercent", margin)}. İade ve vergi gibi dahil olmayan giderleri ayrıca kontrol edin.`, tone: "positive" };
  }

  return {
    title: "Hesaplama tamamlandı",
    body: "Sonucu tek başına değil, işletmenizin diğer giderleri ve hedefleriyle birlikte değerlendirin. Aşağıdaki ilgili araç bir sonraki kontrol için kullanılabilir.",
    tone: "neutral",
  };
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
  if (scenarios.length !== 3) return null;
  const margins = scenarios.map((scenario) => scenario.margin);
  const min = Math.min(...margins);
  const max = Math.max(...margins);
  const spread = Math.max(max - min, 1);
  const xs = [28, 150, 272];
  const ys = margins.map((margin) => 88 - ((margin - min) / spread) * 58);
  const points = xs.map((x, index) => `${x},${ys[index]}`).join(" ");

  return (
    <div className="scenario-chart" aria-label="Fiyat değişimine göre kâr marjı grafiği">
      <svg viewBox="0 0 300 116" role="img" aria-labelledby="scenario-chart-title">
        <title id="scenario-chart-title">Fiyat değişimine göre kâr marjı</title>
        <line x1="28" y1="94" x2="272" y2="94" className="chart-axis" />
        <polyline points={points} className="chart-line" />
        {scenarios.map((scenario, index) => (
          <g key={scenario.label}>
            <circle cx={xs[index]} cy={ys[index]} r="4.5" className={index === 1 ? "chart-point chart-point-current" : "chart-point"} />
            <text x={xs[index]} y="110" textAnchor="middle" className="chart-label">{index === 0 ? "−%10" : index === 1 ? "Mevcut" : "+%10"}</text>
          </g>
        ))}
      </svg>
    </div>
  );
}

export function CalculatorForm({ tool }: { tool: ToolPageDefinition }) {
  const [state, setState] = useState<ResultState>({ status: "idle" });
  const [scenarios, setScenarios] = useState<Scenario[]>([]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState({ status: "loading" });
    setScenarios([]);

    const formData = new FormData(event.currentTarget);
    const values = Object.fromEntries(
      tool.inputs.map((input) => {
        const raw = formData.get(input.key);
        return [input.key, raw === "" || raw === null ? undefined : Number(raw)];
      }),
    ) as Record<string, number | undefined>;

    try {
      const result = await calculate(tool.id, values);
      setState({ status: "success", result, inputs: values });

      if (tool.id === "profit-margin" && typeof values.cost === "number" && typeof values.salePrice === "number") {
        const lowerPrice = Number((values.salePrice * 0.9).toFixed(2));
        const higherPrice = Number((values.salePrice * 1.1).toFixed(2));
        const [lower, higher] = await Promise.all([
          calculate("profit-margin", { cost: values.cost, salePrice: lowerPrice }),
          calculate("profit-margin", { cost: values.cost, salePrice: higherPrice }),
        ]);
        const currentMargin = Number(result.marginPercent);
        const lowerMargin = Number(lower.marginPercent);
        const higherMargin = Number(higher.marginPercent);
        setScenarios([
          {
            label: "%10 daha düşük fiyat",
            value: formatValue("salePrice", lowerPrice),
            detail: `Marj ${formatValue("marginPercent", lowerMargin)}`,
            margin: lowerMargin,
            delta: lowerMargin - currentMargin,
          },
          {
            label: "Mevcut fiyat",
            value: formatValue("salePrice", values.salePrice),
            detail: `Marj ${formatValue("marginPercent", currentMargin)}`,
            margin: currentMargin,
            delta: 0,
          },
          {
            label: "%10 daha yüksek fiyat",
            value: formatValue("salePrice", higherPrice),
            detail: `Marj ${formatValue("marginPercent", higherMargin)}`,
            margin: higherMargin,
            delta: higherMargin - currentMargin,
          },
        ]);
      }
    } catch {
      setState({ status: "error", message: "Hesaplama şu anda tamamlanamadı. Girdiğiniz değerleri kontrol edip tekrar deneyin." });
    }
  }

  const nextTool = nextTools[tool.id];
  const decision = state.status === "success" ? getDecisionCopy(tool.id, state.result) : null;

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

          {scenarios.length > 0 && (
            <div className="scenario-block">
              <div className="result-heading">
                <div>
                  <span className="decision-kicker">Fiyat senaryosu</span>
                  <h3>Fiyat değişirse marj ne olur?</h3>
                </div>
              </div>
              <div className="scenario-grid">
                {scenarios.map((scenario) => (
                  <div className="scenario-card" key={scenario.label}>
                    <span>{scenario.label}</span>
                    <strong>{scenario.value}</strong>
                    <small>{scenario.detail}</small>
                    <em className={scenario.delta > 0 ? "delta-positive" : scenario.delta < 0 ? "delta-negative" : "delta-neutral"}>{formatDelta(scenario.delta)}</em>
                  </div>
                ))}
              </div>
              <ScenarioChart scenarios={scenarios} />
            </div>
          )}

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

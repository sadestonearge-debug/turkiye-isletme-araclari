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
};

const nextTools: Record<string, { slug: string; title: string; detail: string }> = {
  "profit-margin": {
    slug: "iskonto-sonrasi-kar-hesaplama",
    title: "İskonto sonrası kârı kontrol et",
    detail: "Bir kampanya veya indirim yaptığınızda marjınızın ne kadar değişeceğini görün.",
  },
  "target-margin-sale-price": {
    slug: "kar-marji-hesaplama",
    title: "Gerçek kâr marjını kontrol et",
    detail: "Bulduğunuz satış fiyatının maliyetinize göre oluşturduğu marjı doğrulayın.",
  },
  "discount-profit": {
    slug: "kar-marji-hesaplama",
    title: "Normal satış marjını karşılaştır",
    detail: "İndirim öncesi fiyatınızla gerçek kâr marjınızı karşılaştırın.",
  },
  "commission-sale-price": {
    slug: "pazaryeri-net-kar-hesaplama",
    title: "Pazaryeri net kârını hesapla",
    detail: "Komisyona ek olarak ürün, kargo ve reklam maliyetlerini de hesaba katın.",
  },
  "break-even-revenue": {
    slug: "makine-amortisman-hesaplama",
    title: "Yatırım geri dönüşünü hesapla",
    detail: "Yeni bir ekipmanın kendini kaç ayda ödeyeceğini karşılaştırın.",
  },
  "portion-cost": {
    slug: "satis-fiyati-hesaplama",
    title: "Porsiyona satış fiyatı belirle",
    detail: "Bulduğunuz porsiyon maliyetinden hedef marjınıza uygun fiyat oluşturun.",
  },
  "marketplace-net-profit": {
    slug: "komisyon-dahil-satis-fiyati-hesaplama",
    title: "Komisyon dahil satış fiyatını bul",
    detail: "Kesintilerden sonra hedeflediğiniz net tutarı koruyacak fiyatı hesaplayın.",
  },
  "machine-payback": {
    slug: "basa-bas-ciro-hesaplama",
    title: "Başa baş cironuzu hesapla",
    detail: "Yatırım kararını işletmenizin aylık sabit giderleriyle birlikte değerlendirin.",
  },
};

function formatValue(key: string, value: unknown): string {
  if (typeof value !== "number") return String(value);
  const isPercent = key.toLowerCase().includes("percent") || key.toLowerCase().includes("margin") || key.toLowerCase().includes("rate");
  const isMonths = key.toLowerCase().includes("months");
  if (isMonths) return `${value} ay`;
  if (isPercent) return `%${new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 2 }).format(value)}`;
  return `${new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 2 }).format(value)} TL`;
}

function getDecisionCopy(toolId: string, result: Record<string, unknown>): { title: string; body: string; tone: "positive" | "neutral" | "warning" } {
  if (toolId === "profit-margin") {
    const profit = Number(result.unitProfit);
    const margin = Number(result.marginPercent);
    if (Number.isFinite(profit) && profit < 0) {
      return {
        title: "Bu fiyat maliyetinizi karşılamıyor",
        body: `Bu hesapta birim sonuç ${formatValue("unitProfit", profit)} ve marj ${formatValue("marginPercent", margin)}. Satış fiyatını veya maliyet yapınızı yeniden değerlendirmeniz gerekir.`,
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
      title: "Satış fiyatınız maliyetin üzerinde",
      body: `Bu hesapta birim kârınız ${formatValue("unitProfit", profit)} ve kâr marjınız ${formatValue("marginPercent", margin)}. Marjın işletmeniz için yeterli olup olmadığı sektörünüze ve diğer giderlerinize bağlıdır.`,
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
        setScenarios([
          {
            label: "%10 daha düşük fiyat",
            value: formatValue("salePrice", lowerPrice),
            detail: `Marj ${formatValue("marginPercent", lower.marginPercent)}`,
          },
          {
            label: "Mevcut fiyat",
            value: formatValue("salePrice", values.salePrice),
            detail: `Marj ${formatValue("marginPercent", result.marginPercent)}`,
          },
          {
            label: "%10 daha yüksek fiyat",
            value: formatValue("salePrice", higherPrice),
            detail: `Marj ${formatValue("marginPercent", higher.marginPercent)}`,
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
            <span className="decision-kicker">Sonuç yorumu</span>
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
                  </div>
                ))}
              </div>
            </div>
          )}

          {nextTool && (
            <Link className="next-tool" href={`/araclar/${nextTool.slug}`}>
              <div>
                <span className="decision-kicker">Sonraki kontrol</span>
                <strong>{nextTool.title}</strong>
                <p>{nextTool.detail}</p>
              </div>
              <span aria-hidden="true">→</span>
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

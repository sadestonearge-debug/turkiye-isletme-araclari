export type DecisionTone = "positive" | "neutral" | "warning";

export type DecisionCopy = {
  title: string;
  body: string;
  tone: DecisionTone;
};

export type NextTool = {
  slug: string;
  title: string;
  detail: string;
  question: string;
};

export type ScenarioRequest = {
  label: string;
  toolId: string;
  values: Record<string, number | undefined>;
  primaryKey: string;
  detailKey: string;
  current: boolean;
};

export const nextTools: Record<string, NextTool> = {
  "profit-margin": { slug: "iskonto-sonrasi-kar-hesaplama", title: "İskonto sonrası kârı kontrol et", question: "İndirim yapmayı düşünüyor musunuz?", detail: "Bu fiyat üzerinden kampanya yaptığınızda marjınızın ne kadar değişeceğini görün." },
  "target-margin-sale-price": { slug: "kar-marji-hesaplama", title: "Gerçek kâr marjını kontrol et", question: "Bulduğunuz fiyat hedefinizi karşılıyor mu?", detail: "Satış fiyatının maliyetinize göre oluşturduğu gerçek marjı doğrulayın." },
  "discount-profit": { slug: "kar-marji-hesaplama", title: "Normal satış marjını karşılaştır", question: "İndirim öncesi durumu görmek ister misiniz?", detail: "Liste fiyatınızla gerçek kâr marjınızı hesaplayıp indirimli sonuçla karşılaştırın." },
  "commission-sale-price": { slug: "pazaryeri-net-kar-hesaplama", title: "Pazaryeri net kârını hesapla", question: "Komisyon dışında başka giderleriniz de var mı?", detail: "Ürün, kargo ve reklam maliyetlerini de ekleyerek gerçek net sonucu görün." },
  "break-even-revenue": { slug: "makine-amortisman-hesaplama", title: "Yatırım geri dönüşünü hesapla", question: "Yeni bir ekipman yatırımı planlıyor musunuz?", detail: "Yatırımın aylık net katkıyla kaç ayda kendini ödeyeceğini karşılaştırın." },
  "portion-cost": { slug: "satis-fiyati-hesaplama", title: "Porsiyona satış fiyatı belirle", question: "Bu porsiyonu kaça satmanız gerektiğini biliyor musunuz?", detail: "Bulduğunuz maliyetten hedef marjınıza uygun satış fiyatını oluşturun." },
  "marketplace-net-profit": { slug: "komisyon-dahil-satis-fiyati-hesaplama", title: "Komisyon dahil satış fiyatını bul", question: "Net kazanç hedefinizi korumak ister misiniz?", detail: "Kesintilerden sonra hedeflediğiniz net tutarı bırakacak satış fiyatını hesaplayın." },
  "machine-payback": { slug: "basa-bas-ciro-hesaplama", title: "Başa baş cironuzu hesapla", question: "Yatırımı işletmenizin genel giderleriyle birlikte görmek ister misiniz?", detail: "Aylık sabit giderlerinizi karşılamak için gereken minimum ciroyu hesaplayın." },
};

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 2 }).format(value);
}

export function formatValue(key: string, value: unknown): string {
  if (typeof value !== "number") return String(value);
  const lower = key.toLowerCase();
  if (lower.includes("months")) return `${formatNumber(value)} ay`;
  if (lower.includes("percent") || lower.includes("margin") || lower.includes("rate")) return `%${formatNumber(value)}`;
  return `${formatNumber(value)} TL`;
}

export function getDecisionCopy(toolId: string, result: Record<string, unknown>): DecisionCopy {
  if (toolId === "profit-margin") {
    const profit = Number(result.unitProfit);
    const margin = Number(result.marginPercent);
    if (profit < 0) return { title: "Bu fiyat maliyetinizi karşılamıyor", body: `Birim sonuç ${formatValue("unitProfit", profit)} ve marj ${formatValue("marginPercent", margin)}. Satış fiyatını veya maliyet yapınızı yeniden değerlendirin.`, tone: "warning" };
    if (profit === 0) return { title: "Başa baş noktasındasınız", body: "Bu fiyat doğrudan birim kâr üretmiyor. Vergi, komisyon, kargo veya diğer giderler varsa gerçek sonuç negatife dönebilir.", tone: "neutral" };
    return { title: "Kârlı satış", body: `Birim kârınız ${formatValue("unitProfit", profit)}; kâr marjınız ${formatValue("marginPercent", margin)}. Marjın yeterliliği sektörünüze ve diğer giderlerinize bağlıdır.`, tone: "positive" };
  }
  if (toolId === "discount-profit") {
    const profit = Number(result.unitProfit);
    return profit < 0
      ? { title: "İndirim sonrası zarar oluşuyor", body: `İndirimli satışta birim sonuç ${formatValue("unitProfit", profit)}. İndirim oranını veya liste fiyatını yeniden değerlendirin.`, tone: "warning" }
      : { title: "İndirim sonrası kâr pozitif", body: `İndirimli fiyat ${formatValue("discountedPrice", result.discountedPrice)} ve kalan marj ${formatValue("marginPercent", result.marginPercent)}. İndirim büyüdükçe maliyet değişmediği için marj daha hızlı daralabilir.`, tone: "positive" };
  }
  if (toolId === "marketplace-net-profit") {
    const profit = Number(result.netProfit);
    return profit < 0
      ? { title: "Bu satış senaryosu zarar üretiyor", body: `Komisyon ve diğer giderlerden sonra net sonuç ${formatValue("netProfit", profit)}. Fiyatı veya maliyetleri yeniden değerlendirin.`, tone: "warning" }
      : { title: "Satış sonrası net kâr pozitif", body: `Net kâr ${formatValue("netProfit", profit)}, net marj ${formatValue("netMarginPercent", result.netMarginPercent)}. İade ve vergi gibi dahil olmayan giderleri ayrıca kontrol edin.`, tone: "positive" };
  }
  if (toolId === "target-margin-sale-price") return { title: "Hedef fiyata ulaşıldı", body: `Hedef marjınıza göre önerilen satış fiyatı ${formatValue("recommendedSalePrice", result.recommendedSalePrice)}. Gerçek satış koşullarında komisyon, indirim ve ek maliyetleri ayrıca kontrol edin.`, tone: "neutral" };
  if (toolId === "commission-sale-price") return { title: "Komisyon etkisi fiyatınıza dahil edildi", body: `Hedeflediğiniz net tutarı korumak için gereken satış fiyatı ${formatValue("requiredSalePrice", result.requiredSalePrice)}. Diğer satış giderleri bu hesapta yer almıyorsa ayrıca ekleyin.`, tone: "neutral" };
  if (toolId === "break-even-revenue") return { title: "Başa baş ciro bulundu", body: `Sabit giderleri karşılamak için gereken ciro ${formatValue("breakEvenRevenue", result.breakEvenRevenue)}. Bu seviye kâr hedefi değil, yalnızca giderleri karşılama eşiğidir.`, tone: "neutral" };
  if (toolId === "portion-cost") return { title: "Porsiyonun toplam maliyeti hazır", body: `Toplam porsiyon maliyeti ${formatValue("portionCost", result.portionCost)}. Satış fiyatı belirlerken hedef marj, vergi ve kanal giderlerini ayrıca değerlendirin.`, tone: "neutral" };
  if (toolId === "machine-payback") return { title: "Basit geri ödeme süresi bulundu", body: `Yatırımın tahmini geri ödeme süresi ${formatValue("paybackMonths", result.paybackMonths)}. Bu basit yöntem finansman maliyeti ve paranın zaman değerini içermez.`, tone: "neutral" };
  return { title: "Hesaplama tamamlandı", body: "Sonucu işletmenizin diğer giderleri ve hedefleriyle birlikte değerlendirin.", tone: "neutral" };
}

function clampPercent(value: number): number {
  return Math.max(0, Math.min(99, Number(value.toFixed(2))));
}

export function getScenarioRequests(toolId: string, inputs: Record<string, number | undefined>): ScenarioRequest[] {
  const three = (label1: string, values1: Record<string, number | undefined>, label2: string, values2: Record<string, number | undefined>, label3: string, values3: Record<string, number | undefined>, primaryKey: string, detailKey: string): ScenarioRequest[] => [
    { label: label1, toolId, values: values1, primaryKey, detailKey, current: false },
    { label: label2, toolId, values: values2, primaryKey, detailKey, current: true },
    { label: label3, toolId, values: values3, primaryKey, detailKey, current: false },
  ];

  if (toolId === "profit-margin" && inputs.cost != null && inputs.salePrice != null) {
    return three("%10 daha düşük fiyat", { cost: inputs.cost, salePrice: inputs.salePrice * 0.9 }, "Mevcut fiyat", inputs, "%10 daha yüksek fiyat", { cost: inputs.cost, salePrice: inputs.salePrice * 1.1 }, "salePrice", "marginPercent");
  }
  if (toolId === "target-margin-sale-price" && inputs.totalUnitCost != null && inputs.targetMarginPercent != null) {
    return three("5 puan düşük hedef", { totalUnitCost: inputs.totalUnitCost, targetMarginPercent: clampPercent(inputs.targetMarginPercent - 5) }, "Mevcut hedef", inputs, "5 puan yüksek hedef", { totalUnitCost: inputs.totalUnitCost, targetMarginPercent: clampPercent(inputs.targetMarginPercent + 5) }, "recommendedSalePrice", "recommendedSalePrice");
  }
  if (toolId === "discount-profit" && inputs.cost != null && inputs.listPrice != null && inputs.discountPercent != null) {
    return three("5 puan daha az indirim", { cost: inputs.cost, listPrice: inputs.listPrice, discountPercent: clampPercent(inputs.discountPercent - 5) }, "Mevcut indirim", inputs, "5 puan daha fazla indirim", { cost: inputs.cost, listPrice: inputs.listPrice, discountPercent: clampPercent(inputs.discountPercent + 5) }, "discountedPrice", "marginPercent");
  }
  if (toolId === "commission-sale-price" && inputs.targetNet != null && inputs.commissionPercent != null) {
    return three("5 puan düşük komisyon", { targetNet: inputs.targetNet, commissionPercent: clampPercent(inputs.commissionPercent - 5) }, "Mevcut komisyon", inputs, "5 puan yüksek komisyon", { targetNet: inputs.targetNet, commissionPercent: clampPercent(inputs.commissionPercent + 5) }, "requiredSalePrice", "requiredSalePrice");
  }
  if (toolId === "break-even-revenue" && inputs.fixedCosts != null && inputs.contributionMarginPercent != null) {
    return three("5 puan düşük katkı marjı", { fixedCosts: inputs.fixedCosts, contributionMarginPercent: Math.max(1, inputs.contributionMarginPercent - 5) }, "Mevcut katkı marjı", inputs, "5 puan yüksek katkı marjı", { fixedCosts: inputs.fixedCosts, contributionMarginPercent: Math.min(99, inputs.contributionMarginPercent + 5) }, "breakEvenRevenue", "breakEvenRevenue");
  }
  if (toolId === "portion-cost" && inputs.ingredientCost != null) {
    return three("%10 düşük malzeme maliyeti", { ...inputs, ingredientCost: inputs.ingredientCost * 0.9 }, "Mevcut maliyet", inputs, "%10 yüksek malzeme maliyeti", { ...inputs, ingredientCost: inputs.ingredientCost * 1.1 }, "portionCost", "portionCost");
  }
  if (toolId === "marketplace-net-profit" && inputs.salePrice != null) {
    return three("%10 düşük satış fiyatı", { ...inputs, salePrice: inputs.salePrice * 0.9 }, "Mevcut fiyat", inputs, "%10 yüksek satış fiyatı", { ...inputs, salePrice: inputs.salePrice * 1.1 }, "netProfit", "netMarginPercent");
  }
  if (toolId === "machine-payback" && inputs.monthlyNetContribution != null) {
    return three("%10 düşük aylık katkı", { ...inputs, monthlyNetContribution: inputs.monthlyNetContribution * 0.9 }, "Mevcut katkı", inputs, "%10 yüksek aylık katkı", { ...inputs, monthlyNetContribution: inputs.monthlyNetContribution * 1.1 }, "paybackMonths", "paybackMonths");
  }
  return [];
}

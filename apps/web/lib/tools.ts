export type ToolPageDefinition = {
  id: string;
  slug: string;
  title: string;
  shortTitle: string;
  description: string;
  category: string;
  categoryLabel: string;
  inputs: readonly { key: string; label: string; placeholder: string; suffix?: string }[];
  resultLabels: Readonly<Record<string, string>>;
  explanation: string;
  example: string;
};

export const toolPages: readonly ToolPageDefinition[] = [
  {
    id: "profit-margin",
    slug: "kar-marji-hesaplama",
    title: "Kâr Marjı Hesaplama",
    shortTitle: "Kâr Marjı",
    description: "Maliyet ve satış fiyatınızı girin; birim kârınızı, kâr oranınızı ve gerçek marjınızı görün.",
    category: "fiyatlandirma",
    categoryLabel: "Fiyatlandırma",
    inputs: [
      { key: "cost", label: "Birim maliyet", placeholder: "100", suffix: "TL" },
      { key: "salePrice", label: "Satış fiyatı", placeholder: "160", suffix: "TL" },
    ],
    resultLabels: { unitProfit: "Birim kâr", profitRatePercent: "Kâr oranı", marginPercent: "Kâr marjı", breakEvenPrice: "Başa baş fiyatı" },
    explanation: "Kâr oranı maliyete göre, kâr marjı ise satış fiyatına göre hesaplanır. İki oran aynı şeyi ifade etmez.",
    example: "100 TL maliyetli bir ürünü 160 TL'ye satarsanız birim kârınız 60 TL, kâr marjınız %37,5 olur.",
  },
  {
    id: "target-margin-sale-price",
    slug: "satis-fiyati-hesaplama",
    title: "Satış Fiyatı Hesaplama",
    shortTitle: "Satış Fiyatı",
    description: "Toplam maliyetinizi ve hedef marjınızı girin; hedefinize uygun satış fiyatını hesaplayın.",
    category: "fiyatlandirma",
    categoryLabel: "Fiyatlandırma",
    inputs: [
      { key: "totalUnitCost", label: "Toplam birim maliyet", placeholder: "145", suffix: "TL" },
      { key: "targetMarginPercent", label: "Hedef kâr marjı", placeholder: "30", suffix: "%" },
    ],
    resultLabels: { recommendedSalePrice: "Önerilen satış fiyatı" },
    explanation: "Hedef marj, satış fiyatı içerisindeki kâr payını ifade eder. Sistem satış fiyatını bu hedefe göre geriye doğru hesaplar.",
    example: "145 TL toplam maliyet ve %30 hedef marj için önerilen satış fiyatı yaklaşık 207,14 TL'dir.",
  },
  {
    id: "discount-profit",
    slug: "iskonto-sonrasi-kar-hesaplama",
    title: "İskonto Sonrası Kâr Hesaplama",
    shortTitle: "İskonto Sonrası Kâr",
    description: "İndirim yaptıktan sonra kalan birim kârı ve marjı görün.",
    category: "fiyatlandirma",
    categoryLabel: "Fiyatlandırma",
    inputs: [
      { key: "cost", label: "Birim maliyet", placeholder: "100", suffix: "TL" },
      { key: "listPrice", label: "Liste fiyatı", placeholder: "200", suffix: "TL" },
      { key: "discountPercent", label: "İndirim oranı", placeholder: "10", suffix: "%" },
    ],
    resultLabels: { discountedPrice: "İndirimli fiyat", unitProfit: "Birim kâr", marginPercent: "Kalan marj" },
    explanation: "İndirim oranı satış fiyatını düşürürken maliyetiniz değişmez. Bu nedenle küçük indirimler bile marjı beklenenden hızlı azaltabilir.",
    example: "200 TL liste fiyatına %10 indirim uygulandığında satış fiyatı 180 TL'ye düşer.",
  },
  {
    id: "commission-sale-price",
    slug: "komisyon-dahil-satis-fiyati-hesaplama",
    title: "Komisyon Dahil Satış Fiyatı Hesaplama",
    shortTitle: "Komisyon Dahil Fiyat",
    description: "Komisyon kesintisinden sonra hedeflediğiniz net tutarı koruyacak satış fiyatını bulun.",
    category: "fiyatlandirma",
    categoryLabel: "Fiyatlandırma",
    inputs: [
      { key: "targetNet", label: "Hedef net tutar", placeholder: "100", suffix: "TL" },
      { key: "commissionPercent", label: "Komisyon oranı", placeholder: "20", suffix: "%" },
    ],
    resultLabels: { requiredSalePrice: "Gerekli satış fiyatı" },
    explanation: "Komisyon satış fiyatı üzerinden kesildiği için yalnızca hedef net tutarın üzerine komisyon yüzdesi eklemek doğru sonuç vermez.",
    example: "%20 komisyonla net 100 TL kalmasını istiyorsanız satış fiyatının 125 TL olması gerekir.",
  },
  {
    id: "break-even-revenue",
    slug: "basa-bas-ciro-hesaplama",
    title: "Başa Baş Ciro Hesaplama",
    shortTitle: "Başa Baş Ciro",
    description: "Sabit giderlerinizi karşılamak için gereken minimum aylık ciroyu hesaplayın.",
    category: "finans",
    categoryLabel: "Finans",
    inputs: [
      { key: "fixedCosts", label: "Aylık sabit giderler", placeholder: "300000", suffix: "TL" },
      { key: "contributionMarginPercent", label: "Katkı marjı", placeholder: "60", suffix: "%" },
    ],
    resultLabels: { breakEvenRevenue: "Başa baş ciro" },
    explanation: "Başa baş noktası, işletmenin sabit giderlerini karşılayıp henüz kâr veya zarar üretmediği satış seviyesidir.",
    example: "300.000 TL sabit gider ve %60 katkı marjında başa baş ciro 500.000 TL'dir.",
  },
  {
    id: "portion-cost",
    slug: "porsiyon-maliyeti-hesaplama",
    title: "Porsiyon Maliyeti Hesaplama",
    shortTitle: "Porsiyon Maliyeti",
    description: "Malzeme, fire, ambalaj ve ek maliyetleri tek porsiyon maliyetinde birleştirin.",
    category: "kafe-restoran",
    categoryLabel: "Kafe & Restoran",
    inputs: [
      { key: "ingredientCost", label: "Malzeme maliyeti", placeholder: "50", suffix: "TL" },
      { key: "wastePercent", label: "Fire oranı", placeholder: "10", suffix: "%" },
      { key: "packagingCost", label: "Ambalaj maliyeti", placeholder: "5", suffix: "TL" },
      { key: "extraCost", label: "Diğer maliyet", placeholder: "2", suffix: "TL" },
    ],
    resultLabels: { portionCost: "Toplam porsiyon maliyeti", wasteCost: "Fire maliyeti" },
    explanation: "Gerçek porsiyon maliyeti yalnızca reçete malzemelerinden oluşmaz. Fire ve ambalaj gibi küçük kalemler toplam maliyeti anlamlı biçimde etkileyebilir.",
    example: "50 TL malzeme, %10 fire, 5 TL ambalaj ve 2 TL ek maliyetle porsiyon maliyeti 62 TL olur.",
  },
  {
    id: "marketplace-net-profit",
    slug: "pazaryeri-net-kar-hesaplama",
    title: "Pazaryeri Net Kâr Hesaplama",
    shortTitle: "Pazaryeri Net Kâr",
    description: "Ürün maliyeti, komisyon, kargo ve reklam giderlerinden sonra kalan gerçek kârı görün.",
    category: "e-ticaret",
    categoryLabel: "E-Ticaret",
    inputs: [
      { key: "salePrice", label: "Satış fiyatı", placeholder: "500", suffix: "TL" },
      { key: "productCost", label: "Ürün maliyeti", placeholder: "200", suffix: "TL" },
      { key: "commissionPercent", label: "Komisyon oranı", placeholder: "20", suffix: "%" },
      { key: "shippingCost", label: "Kargo maliyeti", placeholder: "50", suffix: "TL" },
      { key: "adCost", label: "Satış başı reklam maliyeti", placeholder: "25", suffix: "TL" },
    ],
    resultLabels: { commissionCost: "Komisyon maliyeti", netProfit: "Net kâr", netMarginPercent: "Net marj" },
    explanation: "Pazaryeri satışlarında yalnızca ürün alış maliyetini düşmek gerçek kârı göstermez. Komisyon, kargo ve reklam maliyetleri birlikte değerlendirilmelidir.",
    example: "500 TL satışta 200 TL ürün maliyeti, %20 komisyon, 50 TL kargo ve 25 TL reklam gideri sonrası net kâr 125 TL'dir.",
  },
  {
    id: "machine-payback",
    slug: "makine-amortisman-hesaplama",
    title: "Makine Amortisman Süresi Hesaplama",
    shortTitle: "Makine Amortismanı",
    description: "Bir ekipman yatırımının aylık net katkıyla kaç ayda kendini ödeyeceğini görün.",
    category: "finans",
    categoryLabel: "Finans",
    inputs: [
      { key: "investmentCost", label: "Yatırım maliyeti", placeholder: "100000", suffix: "TL" },
      { key: "monthlyNetContribution", label: "Aylık net katkı", placeholder: "12000", suffix: "TL" },
    ],
    resultLabels: { paybackMonths: "Geri ödeme süresi" },
    explanation: "Bu basit geri ödeme yöntemi finansman maliyeti ve paranın zaman değerini içermez; ilk yatırım kararını hızlı karşılaştırmak için kullanılır.",
    example: "100.000 TL yatırım aylık 12.000 TL net katkı sağlıyorsa basit geri ödeme süresi 9 aydır.",
  },
] as const;

export function getToolPageBySlug(slug: string): ToolPageDefinition | undefined {
  return toolPages.find((tool) => tool.slug === slug);
}

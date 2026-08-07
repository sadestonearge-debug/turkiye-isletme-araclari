export type FaqItem = { question: string; answer: string };

export const REVIEWED_AT = "2026-08-07";

const commonFaqs: readonly FaqItem[] = [
  {
    question: "Bu araç ücretsiz mi?",
    answer: "Evet. Hesaplama aracı ücretsiz kullanılabilir ve temel hesaplama için üyelik gerekmez.",
  },
  {
    question: "Sonuçlar nasıl hesaplanıyor?",
    answer: "Sayısal sonuçlar yapay zekâ tarafından değil, test edilmiş deterministik hesaplama fonksiyonları tarafından üretilir. Yapay zekâ yalnızca isteğe bağlı açıklama katmanında kullanılır.",
  },
];

const toolFaqs: Readonly<Record<string, readonly FaqItem[]>> = {
  "profit-margin": [
    { question: "Kâr oranı ile kâr marjı aynı mı?", answer: "Hayır. Kâr oranı kârı maliyete göre, kâr marjı ise kârı satış fiyatına göre ifade eder." },
    { question: "Hangi kâr marjı iyidir?", answer: "Tek bir evrensel oran yoktur. Uygun marj sektör, işletme giderleri, vergi, komisyon, fire ve hedeflere göre değişir." },
  ],
  "target-margin-sale-price": [
    { question: "Hedef marj neden satış fiyatına doğrudan eklenmiyor?", answer: "Marj satış fiyatının içindeki kâr payıdır. Bu nedenle maliyetin üzerine aynı yüzdeyi eklemek hedef marjı her zaman vermez." },
    { question: "KDV ve komisyon bu hesaba dahil mi?", answer: "Yalnızca girdi olarak verdiğiniz toplam birim maliyet ve hedef marj kullanılır. Ek maliyetleri toplam maliyete dahil etmeniz gerekir." },
  ],
  "discount-profit": [
    { question: "İndirim kâr marjını neden hızlı düşürür?", answer: "İndirim satış fiyatını azaltırken birim maliyet aynı kalır; bu nedenle kâr tutarı ve marj satış fiyatından daha hızlı azalabilir." },
    { question: "İndirim sonrası zarar edip etmediğimi görebilir miyim?", answer: "Evet. Araç indirimli fiyatı, kalan birim kârı ve kalan marjı birlikte gösterir." },
  ],
  "commission-sale-price": [
    { question: "Komisyonu fiyata yüzde olarak eklemek yeterli mi?", answer: "Genellikle hayır. Komisyon satış fiyatı üzerinden kesildiği için hedef net tutardan geriye doğru hesaplama gerekir." },
    { question: "Kargo ve reklam giderleri burada dahil mi?", answer: "Bu araç hedef net tutar ve komisyon oranına odaklanır. Kargo ve reklam dahil net kâr için Pazaryeri Net Kâr aracını kullanabilirsiniz." },
  ],
  "break-even-revenue": [
    { question: "Başa baş ciro neyi ifade eder?", answer: "Sabit giderleri karşılayıp henüz kâr veya zarar üretmediğiniz yaklaşık ciro seviyesini ifade eder." },
    { question: "Katkı marjı nedir?", answer: "Satışlardan değişken maliyetler çıktıktan sonra sabit giderleri karşılamaya kalan payın satışlara oranıdır." },
  ],
  "portion-cost": [
    { question: "Fire maliyetini neden eklemeliyim?", answer: "Hazırlık ve üretim kayıpları gerçek porsiyon maliyetini artırır. Fireyi yok saymak satış fiyatını olduğundan düşük belirlemenize neden olabilir." },
    { question: "Ambalaj maliyeti zorunlu mu?", answer: "Hayır. Ambalaj kullanmıyorsanız alanı boş bırakabilirsiniz." },
  ],
  "marketplace-net-profit": [
    { question: "Net kâr hesabına hangi giderler dahil?", answer: "Ürün maliyeti, komisyon, kargo ve satış başına reklam maliyeti hesaba dahil edilir." },
    { question: "Vergi ve iade maliyeti dahil mi?", answer: "Hayır. Vergi, iade, depolama ve diğer operasyon giderlerini ayrıca değerlendirmeniz gerekir." },
  ],
  "machine-payback": [
    { question: "Amortisman süresi burada muhasebe amortismanı mı?", answer: "Hayır. Bu araç basit yatırım geri ödeme süresini hesaplar; muhasebe amortisman yöntemi değildir." },
    { question: "Finansman maliyeti dahil mi?", answer: "Hayır. Basit geri ödeme hesabı faiz, enflasyon ve paranın zaman değerini içermez." },
  ],
};

export function getFaqs(toolId: string): readonly FaqItem[] {
  return [...(toolFaqs[toolId] ?? []), ...commonFaqs];
}

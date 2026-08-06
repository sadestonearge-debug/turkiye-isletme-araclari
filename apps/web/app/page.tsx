import Link from "next/link";
import { ToolFinder } from "../components/tool-finder";
import { toolPages } from "../lib/tools";

const categories = [
  ["Fiyatlandırma", "Satış fiyatı, marj, iskonto ve komisyon hesapları"],
  ["Finans", "Başa baş noktası ve yatırım geri dönüş hesapları"],
  ["Kafe & Restoran", "Porsiyon ve operasyon maliyeti araçları"],
  ["E-Ticaret", "Pazaryeri satışında gerçek net kâr hesapları"],
] as const;

export default function HomePage() {
  return (
    <>
      <section className="hero">
        <div className="shell">
          <span className="badge">Ücretsiz işletme araçları</span>
          <h1>İşletmeni tahminle değil, hesapla yönet.</h1>
          <p>
            Fiyat, maliyet, kârlılık ve yatırım kararlarını sade hesaplama araçlarıyla birkaç saniyede kontrol et.
          </p>
          <ToolFinder />
        </div>
      </section>

      <section className="section" id="araclar">
        <div className="shell">
          <h2 className="section-title">Öne çıkan araçlar</h2>
          <div className="grid">
            {toolPages.map((tool) => (
              <Link className="card" key={tool.id} href={`/araclar/${tool.slug}`}>
                <span className="badge">{tool.categoryLabel}</span>
                <h3>{tool.shortTitle}</h3>
                <p>{tool.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section" id="kategoriler">
        <div className="shell">
          <h2 className="section-title">İşletme ihtiyacına göre</h2>
          <div className="grid">
            {categories.map(([title, description]) => (
              <article className="card" key={title}>
                <h3>{title}</h3>
                <p>{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

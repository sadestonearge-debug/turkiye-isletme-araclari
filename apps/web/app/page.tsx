import Link from "next/link";
import { ToolFinder } from "../components/tool-finder";
import { toolPages } from "../lib/tools";

export default function HomePage() {
  return (
    <>
      <section className="hero">
        <div className="shell hero-shell">
          <span className="eyebrow">Ücretsiz işletme araçları</span>
          <h1>İşletmeni tahminle değil, hesapla yönet.</h1>
          <p>
            Fiyat, maliyet, kârlılık ve yatırım kararlarını sade hesaplama araçlarıyla birkaç saniyede kontrol et.
          </p>
          <ToolFinder />
        </div>
      </section>

      <section className="section section-tools" id="araclar">
        <div className="shell">
          <div className="section-heading-row">
            <div>
              <h2 className="section-title">İşletme araçları</h2>
              <p className="section-copy">İhtiyacın olan hesabı seç, değerlerini gir ve sonucu hemen gör.</p>
            </div>
            <span className="tool-count">{toolPages.length} araç</span>
          </div>

          <div className="grid tool-grid">
            {toolPages.map((tool) => (
              <Link className="card tool-card" key={tool.id} href={`/araclar/${tool.slug}`}>
                <span className="badge">{tool.categoryLabel}</span>
                <div className="card-title-row">
                  <h3>{tool.shortTitle}</h3>
                  <span className="card-arrow" aria-hidden="true">→</span>
                </div>
                <p>{tool.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

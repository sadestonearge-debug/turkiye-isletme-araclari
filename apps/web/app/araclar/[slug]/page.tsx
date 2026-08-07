import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { CalculatorForm } from "../../../components/calculator-form";
import { PrefillBridge } from "../../../components/prefill-bridge";
import { getFaqs, REVIEWED_AT } from "../../../lib/seo-content";
import { getToolPageBySlug, toolPages } from "../../../lib/tools";

type PageProps = { params: Promise<{ slug: string }> };

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export function generateStaticParams() {
  return toolPages.map((tool) => ({ slug: tool.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const tool = getToolPageBySlug(slug);
  if (!tool) return {};

  return {
    title: tool.title,
    description: tool.description,
    alternates: { canonical: `/araclar/${tool.slug}` },
    openGraph: {
      title: tool.title,
      description: tool.description,
      type: "website",
      url: `/araclar/${tool.slug}`,
      locale: "tr_TR",
      siteName: "Türkiye İşletme Araçları",
    },
  };
}

export default async function ToolPage({ params }: PageProps) {
  const { slug } = await params;
  const tool = getToolPageBySlug(slug);
  if (!tool) notFound();

  const related = toolPages.filter((candidate) => candidate.id !== tool.id && candidate.category === tool.category).slice(0, 3);
  const faqs = getFaqs(tool.id);
  const pageUrl = `${siteUrl.replace(/\/$/, "")}/araclar/${tool.slug}`;

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Ana sayfa", item: siteUrl },
      { "@type": "ListItem", position: 2, name: tool.categoryLabel },
      { "@type": "ListItem", position: 3, name: tool.title, item: pageUrl },
    ],
  };

  const applicationJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: tool.title,
    description: tool.description,
    url: pageUrl,
    applicationCategory: tool.category === "finans" ? "FinanceApplication" : "BusinessApplication",
    operatingSystem: "Any",
    inLanguage: "tr-TR",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "TRY",
    },
  };

  return (
    <div className="shell">
      <article className="tool-wrap">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(applicationJsonLd) }} />

        <nav aria-label="İçerik yolu">
          <Link href="/">Ana sayfa</Link> <span aria-hidden="true">/</span> <span>{tool.categoryLabel}</span> <span aria-hidden="true">/</span> <span>{tool.shortTitle}</span>
        </nav>

        <div style={{ marginTop: 24 }}>
          <span className="badge">{tool.categoryLabel}</span>
          <h1>{tool.title}</h1>
          <p className="lede">{tool.description}</p>
        </div>

        <Suspense fallback={null}>
          <PrefillBridge fields={tool.inputs} />
        </Suspense>
        <CalculatorForm tool={tool} />

        <section className="content-block" aria-labelledby="calculation-info-heading">
          <h2 id="calculation-info-heading">Bu hesaplama neyi gösterir?</h2>
          <p>{tool.explanation}</p>
        </section>

        <section className="content-block" aria-labelledby="example-heading">
          <h2 id="example-heading">Örnek hesaplama</h2>
          <p>{tool.example}</p>
        </section>

        <section className="content-block trust-block" aria-labelledby="trust-heading">
          <h2 id="trust-heading">Hesaplama ve güncellik bilgisi</h2>
          <p>Son kontrol tarihi: <time dateTime={REVIEWED_AT}>7 Ağustos 2026</time>.</p>
          <p>Sayısal sonuçlar test edilmiş hesaplama motoru tarafından üretilir. Yapay zekâ varsa yalnızca ayrı bir açıklama katmanı olarak çalışır ve hesap sonucunu değiştiremez.</p>
        </section>

        <section className="content-block" aria-labelledby="faq-heading">
          <h2 id="faq-heading">Sık sorulan sorular</h2>
          <div className="faq-list">
            {faqs.map((faq) => (
              <details className="faq-item" key={faq.question}>
                <summary>{faq.question}</summary>
                <p>{faq.answer}</p>
              </details>
            ))}
          </div>
        </section>

        {related.length > 0 && (
          <section className="content-block">
            <h2>İlgili araçlar</h2>
            <div className="grid">
              {related.map((item) => (
                <Link className="card" href={`/araclar/${item.slug}`} key={item.id}>
                  <h3>{item.shortTitle}</h3>
                  <p>{item.description}</p>
                </Link>
              ))}
            </div>
          </section>
        )}
      </article>
    </div>
  );
}

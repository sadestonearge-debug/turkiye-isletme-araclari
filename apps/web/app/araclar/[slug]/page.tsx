import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CalculatorForm } from "../../../components/calculator-form";
import { getToolPageBySlug, toolPages } from "../../../lib/tools";

type PageProps = { params: Promise<{ slug: string }> };

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
    },
  };
}

export default async function ToolPage({ params }: PageProps) {
  const { slug } = await params;
  const tool = getToolPageBySlug(slug);
  if (!tool) notFound();

  const related = toolPages.filter((candidate) => candidate.id !== tool.id && candidate.category === tool.category).slice(0, 3);

  return (
    <div className="shell">
      <article className="tool-wrap">
        <nav aria-label="İçerik yolu">
          <Link href="/">Ana sayfa</Link> <span aria-hidden="true">/</span> <span>{tool.categoryLabel}</span>
        </nav>

        <div style={{ marginTop: 24 }}>
          <span className="badge">{tool.categoryLabel}</span>
          <h1>{tool.title}</h1>
          <p className="lede">{tool.description}</p>
        </div>

        <CalculatorForm tool={tool} />

        <section className="content-block">
          <h2>Bu hesaplama neyi gösterir?</h2>
          <p>{tool.explanation}</p>
        </section>

        <section className="content-block">
          <h2>Örnek hesaplama</h2>
          <p>{tool.example}</p>
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

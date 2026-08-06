import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Türkiye İşletme Araçları",
    template: "%s | Türkiye İşletme Araçları",
  },
  description: "Küçük işletmeler için sade, hızlı ve ücretsiz hesaplama araçları.",
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="tr">
      <body>
        <header className="header">
          <div className="shell header-inner">
            <Link className="brand" href="/">İşletme Araçları</Link>
            <nav className="nav" aria-label="Ana menü">
              <Link href="/#araclar">Araçlar</Link>
              <Link href="/#kategoriler">Kategoriler</Link>
            </nav>
          </div>
        </header>
        <main>{children}</main>
        <footer className="footer">
          <div className="shell">Hesaplamalar bilgilendirme amaçlıdır. Kritik kararlar için ilgili uzman ve resmî kaynakları kontrol edin.</div>
        </footer>
      </body>
    </html>
  );
}

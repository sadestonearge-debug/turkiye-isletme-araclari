import type { MetadataRoute } from "next";
import { toolPages } from "../lib/tools";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: siteUrl, changeFrequency: "weekly", priority: 1 },
    ...toolPages.map((tool) => ({
      url: `${siteUrl}/araclar/${tool.slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
  ];
}

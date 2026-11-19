import { HEXAGRAMS } from "@/lib/hexagrams";
import { SITE_URL } from "@/lib/config";

export default function sitemap() {
  const base = SITE_URL || "http://localhost:3000";
  const now = new Date();
  const staticRoutes = ["", "/64-que", "/luan-sau", "/tra-cuu", "/dieu-khoan", "/chinh-sach-thanh-toan", "/lien-he"].map(
    (p) => ({ url: base + p, lastModified: now, changeFrequency: "weekly", priority: p === "" ? 1 : 0.6 })
  );
  const hexRoutes = HEXAGRAMS.map((h) => ({
    url: `${base}/que/${h.slug}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.7,
  }));
  return [...staticRoutes, ...hexRoutes];
}

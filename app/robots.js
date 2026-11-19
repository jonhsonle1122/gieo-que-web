import { SITE_URL } from "@/lib/config";

export default function robots() {
  const base = SITE_URL || "http://localhost:3000";
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/api/"] }],
    sitemap: `${base}/sitemap.xml`,
  };
}

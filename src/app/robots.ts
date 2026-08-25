import { SITE_URL } from "@/lib/seo";
import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // API routes, the PostHog proxy, and the resume review step (form state only).
      disallow: ["/api/", "/ingest/", "/resume-checker/review"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}

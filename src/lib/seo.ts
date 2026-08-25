import type { Metadata } from "next";
export const SITE_URL = "https://open.silver.dev";
export const SITE_NAME = "Open Silver";

/** SEO length budgets, mirroring the Ahrefs thresholds flagged in the site audit. */
export const TITLE_MIN = 30;
export const TITLE_MAX = 60;
export const DESCRIPTION_MIN = 110;
export const DESCRIPTION_MAX = 160;

/** Every indexable route on the site. Used by the sitemap. */
export const INDEXABLE_ROUTES = [
  "/",
  "/behavioral-checker",
  "/fees-calculator",
  "/invoice-generator",
  "/resume-checker",
  "/resume-checker/privacy",
  "/roast-me",
  "/roast-me/unhinged",
  "/salary-calculator",
  "/take-home-checker",
] as const;

const OG_IMAGE = {
  url: "/opengraph-image",
  width: 1200,
  height: 630,
  alt: `${SITE_NAME} — Open Source Software made by Silver.dev`,
};

export const DEFAULT_OPEN_GRAPH: NonNullable<Metadata["openGraph"]> = {
  type: "website",
  siteName: SITE_NAME,
  locale: "en_US",
  url: SITE_URL,
  images: [OG_IMAGE],
};

export const DEFAULT_TWITTER: NonNullable<Metadata["twitter"]> = {
  card: "summary_large_image",
  images: [OG_IMAGE.url],
};

/**
 * Builds a complete Metadata object for a page. Next.js replaces (does not
 * deep-merge) `openGraph`/`twitter` when a page defines them, so every page
 * goes through here to keep type, siteName, image and canonical consistent.
 */
export function pageMetadata({
  title,
  description,
  path,
  ogTitle,
  ogDescription,
}: {
  /** Page title, templated as "%s • Open Silver" (30–60 chars total). */
  title: Metadata["title"];
  /** 110–160 chars. */
  description: string;
  /** Route path, e.g. "/resume-checker". Used for canonical and og:url. */
  path: string;
  ogTitle: string;
  ogDescription?: string;
}): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      ...DEFAULT_OPEN_GRAPH,
      title: ogTitle,
      description: ogDescription ?? description,
      url: path,
    },
    twitter: {
      ...DEFAULT_TWITTER,
      title: ogTitle,
      description: ogDescription ?? description,
    },
  };
}

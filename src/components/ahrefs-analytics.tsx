import Script from "next/script";

const AHREFS_ANALYTICS_KEY = process.env.NEXT_PUBLIC_AHREFS_ANALYTICS_KEY;

export function AhrefsAnalytics() {
  if (!AHREFS_ANALYTICS_KEY) {
    return null;
  }

  return (
    <Script
      src="https://analytics.ahrefs.com/analytics.js"
      data-key={AHREFS_ANALYTICS_KEY}
      strategy="afterInteractive"
    />
  );
}

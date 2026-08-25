import { pageMetadata } from "@/lib/seo";
import type { Metadata } from "next";
import { FeesCalculator } from "./client";

export const metadata: Metadata = pageMetadata({
  title: "Recruiting Agency Fees Calculator",
  description:
    "Calculate and understand recruiting agency fees. Adjust hiring terms, compare options, and share your estimate with Silver to plan your next hire.",
  path: "/fees-calculator",
  ogTitle: "Fees Calculator • Open Silver",
  ogDescription:
    "Calculate and understand recruiting agency fees with our interactive calculator.",
});

export default function FeesCalculatorPage() {
  return <FeesCalculator />;
}

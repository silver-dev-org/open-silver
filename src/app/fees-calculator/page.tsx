import { Description } from "@/components/description";
import { Heading } from "@/components/heading";
import { Section } from "@/components/section";
import { Spacer } from "@/components/spacer";
import { pageMetadata } from "@/lib/seo";
import type { Metadata } from "next";
import { Suspense } from "react";
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
  return (
    <Section className="flex flex-col">
      <Heading lvl={1} center>
        Agency Fees <span className="text-primary">Explained</span>
      </Heading>
      <Spacer />
      <Description center>
        Adjust terms, explore options, and share your estimate with Silver.
      </Description>
      <Spacer size="lg" />
      <Suspense>
        <FeesCalculator />
      </Suspense>
    </Section>
  );
}

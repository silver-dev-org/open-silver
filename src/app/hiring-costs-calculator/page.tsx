import Heading from "@/components/heading";
import Section from "@/components/section";
import Spacer from "@/components/spacer";
import { Metadata } from "next";
import { HiringCostsCalculator } from "./client";

export const metadata: Metadata = {
  title: "Argentina Hiring Costs Calculator",
  description: "Understand hiring costs in Argentina, comparing EOR vs AOR.",
  openGraph: {
    title: "Argentina Hiring Costs Calculator",
    description: "Understand hiring costs in Argentina, comparing EOR vs AOR.",
    type: "website",
  },
};

export default function Page() {
  return (
    <Section>
      <Heading center>
        Argentina <span className="text-primary">Hiring Costs</span> Calculator
      </Heading>
      <Spacer size="lg" />
      <HiringCostsCalculator />
    </Section>
  );
}

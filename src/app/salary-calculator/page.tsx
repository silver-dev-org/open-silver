import Heading from "@/components/heading";
import Section from "@/components/section";
import Spacer from "@/components/spacer";
import Description from "@/components/description";
import { Metadata } from "next";
import { SalaryCalculator } from "./client";

export const metadata: Metadata = {
  title: "Argentina Salary Calculator",
  description: "Understand salary in Argentina, comparing EOR vs AOR.",
  openGraph: {
    title: "Argentina Salary Calculator",
    description: "Understand salary in Argentina, comparing EOR vs AOR.",
    type: "website",
  },
};

export default function Page() {
  return (
    <Section>
      <Heading center>
        Argentina <span className="text-primary">Salary</span> Calculator
      </Heading>
      <Spacer />
      <Description className="text-center mx-auto">
        Compare employer and worker costs between EOR and Contractors for
        Argentina.
      </Description>
      <Spacer size="lg" />
      <SalaryCalculator />
    </Section>
  );
}

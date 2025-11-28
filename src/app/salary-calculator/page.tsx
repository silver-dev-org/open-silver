import { Heading } from "@/components/heading";
import { Section } from "@/components/section";
import { Spacer } from "@/components/spacer";
import { Description } from "@/components/description";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Metadata } from "next";
import Link from "next/link";
import { SalaryCalculator } from "./client";
import { Divider } from "@/components/divider";

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
      <Divider />
      <Card className="max-w-prose mx-auto text-balance">
        <CardHeader>
          <CardTitle>
            Do you want to understand how hiring works in Argentina?
          </CardTitle>
          <CardDescription>
            Book a meeting with{" "}
            <Link
              className="link"
              target="_blank"
              href="https://silver.dev/about"
            >
              our founder
            </Link>{" "}
            to learn about the details and find out the best strategy for your
            company.
          </CardDescription>
        </CardHeader>
        <CardFooter className="justify-center">
          <Button asChild size="lg" className="w-full">
            <Link
              target="_blank"
              href="https://calendly.com/silver-dev/companies?utm_source=salarycalculator"
            >
              Book a Meeting
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </Section>
  );
}

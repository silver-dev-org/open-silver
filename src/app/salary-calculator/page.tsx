import { Heading } from "@/components/heading";
import { Container } from "@/components/container";
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
import { pageMetadata } from "@/lib/seo";
import type { Metadata } from "next";
import Link from "next/link";
import { SalaryCalculator } from "@/salary-calculator";
import { Divider } from "@/components/divider";
import { Suspense } from "react";

export const metadata: Metadata = pageMetadata({
  title: "Argentina Salary Calculator: EOR vs AOR",
  description:
    "Understand what a salary in Argentina really costs and pays out. Compare Employer of Record (EOR) against Agency of Record (AOR) for any gross amount.",
  path: "/salary-calculator",
  ogTitle: "Argentina Salary Calculator • Open Silver",
  ogDescription:
    "Understand what a salary in Argentina really costs and pays out, comparing EOR vs AOR.",
});

export default function Page() {
  return (
    <Container>
      <Heading lvl={1} center>
        Argentina <span className="text-primary">Salary</span> Calculator
      </Heading>
      <Spacer />
      <Description center>
        Compare employer and worker costs between EOR and Contractors for
        Argentina.
      </Description>
      <Spacer size="lg" />
      <Suspense>
        <SalaryCalculator />
      </Suspense>
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
              href="https://calendly.com/silver.dev/companies?utm_source=salarycalculator"
            >
              Book a Meeting
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </Container>
  );
}

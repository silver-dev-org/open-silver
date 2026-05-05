"use client";

import { Container } from "@/components/container";
import { Heading, Subheading } from "@/components/heading";
import { Spacer } from "@/components/spacer";
import { KeyForm } from "@/token-tracker/components/key-form";

interface HomeProps {
  initialToken?: string;
}

export function Home({ initialToken }: HomeProps) {
  return (
    <Container>
      <Heading lvl={1} center>
        <span className="text-primary">Token</span> Tracker
      </Heading>
      <Spacer />
      <Subheading center>
        Submit your work email and a read-only API key to record this
        month&apos;s usage for your team. Your key is encrypted securely and
        refreshed automatically every few hours.
      </Subheading>
      <Spacer size="lg" />
      <KeyForm initialToken={initialToken} />
    </Container>
  );
}

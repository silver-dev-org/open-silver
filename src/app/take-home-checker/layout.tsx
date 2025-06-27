"use client";

import Description from "@/components/description";
import Heading from "@/components/heading";
import Section from "@/components/section";
import Spacer from "@/components/spacer";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <Section>
      <Heading size="lg" center>
        <span className="text-primary">Take-home</span> Checker
      </Heading>
      <Spacer />
      <Description center>
        Upload your take-home and get instant feedback on the project.
      </Description>
      <Spacer size="lg" />
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </Section>
  );
}

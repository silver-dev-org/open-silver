"use client";

import { Layout } from "@/resume-checker/components/layout";
import { FormProvider } from "@/resume-checker/hooks/form-context";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();

export default function ResumeCheckerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <QueryClientProvider client={queryClient}>
      <FormProvider>
        <Layout>{children}</Layout>
      </FormProvider>
    </QueryClientProvider>
  );
}

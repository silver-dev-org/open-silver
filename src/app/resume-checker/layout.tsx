"use client";

import { FormProvider } from "@/resume-checker/hooks/form-context";

export default function ResumeCheckerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <FormProvider>{children}</FormProvider>;
}

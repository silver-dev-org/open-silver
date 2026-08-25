import { Home } from "@/resume-checker/pages/index";
import { pageMetadata } from "@/lib/seo";
import type { Metadata } from "next";

export const metadata: Metadata = pageMetadata({
  title: "Resume Checker: Free Instant CV Feedback",
  description:
    "Upload your CV and get instant, actionable feedback on structure, content, and formatting to improve your job application and land more interviews.",
  path: "/resume-checker",
  ogTitle: "Resume Checker • Open Silver",
  ogDescription:
    "Upload your CV and get instant, actionable feedback to improve your job application.",
});

export default function ResumeCheckerPage() {
  return <Home />;
}

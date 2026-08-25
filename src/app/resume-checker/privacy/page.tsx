import { pageMetadata } from "@/lib/seo";
import type { Metadata } from "next";

export const metadata: Metadata = pageMetadata({
  title: "Resume Checker Privacy Policy",
  description:
    "How the Resume Checker handles your data: resumes are analyzed with AI, never stored on our servers, and no personal information is retained after processing.",
  path: "/resume-checker/privacy",
  ogTitle: "Resume Checker Privacy Policy • Open Silver",
  ogDescription:
    "How the Resume Checker handles your data: resumes are analyzed with AI and never stored.",
});

export { Privacy as default } from "@/resume-checker/pages/privacy";

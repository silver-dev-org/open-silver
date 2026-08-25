import { Home } from "@/behavioral-checker/pages/index";
import { pageMetadata } from "@/lib/seo";
import type { Metadata } from "next";

export const metadata: Metadata = pageMetadata({
  title: "Behavioral Checker: Practice Interviews",
  description:
    "Answer classic behavioral interview questions and get instant, AI-powered feedback on your responses to improve your interview skills before the real thing.",
  path: "/behavioral-checker",
  ogTitle: "Behavioral Checker • Open Silver",
  ogDescription:
    "Answer classic behavioral interview questions and get instant, AI-powered feedback on your responses.",
});

export default function BehavioralCheckerPage() {
  return <Home />;
}

import Home from "@/resume-checker/pages/index";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Resume Checker",
  description:
    "Upload your CV and get instant feedback to improve your job application.",
  openGraph: {
    title: "Resume Checker • Open Silver",
    description:
      "Get instant feedback on your resume to improve your job application",
    type: "website",
  },
};

export default function ResumeCheckerPage() {
  return <Home />;
}

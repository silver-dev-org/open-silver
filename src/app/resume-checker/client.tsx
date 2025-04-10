"use client";

import Home from "@/resume-checker/pages/index";
import { GoogleAnalytics } from "@next/third-parties/google";

export default function ResumeCheckerClient() {
  return (
    <>
      <Home />
      <GoogleAnalytics gaId="G-QFVTDBRTP4" />
    </>
  );
}

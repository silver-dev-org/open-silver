"use client";

import Home from "@/company-checker/pages/index";
import { GoogleAnalytics } from "@next/third-parties/google";

export default function CompanyCheckerClient() {
  return (
    <>
      <Home />
      <GoogleAnalytics gaId="G-QFVTDBRTP4" />
    </>
  );
}

import { Metadata } from "next";
import FeesCalculatorClient from "./client";

export const metadata: Metadata = {
  title: "Fees Calculator",
  description:
    "Calculate and understand agency fees. Adjust terms, explore options, and share your estimate with Silver.",
  openGraph: {
    title: "Fees Calculator • Open Silver",
    description:
      "Calculate and understand agency fees with our interactive calculator",
    type: "website",
  },
};

export default function FeesCalculatorPage() {
  return <FeesCalculatorClient />;
}

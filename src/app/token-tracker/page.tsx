import { METADATA } from "@/token-tracker/constants";
import { LandingPage } from "@/token-tracker/pages/landing";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: METADATA.title,
  description: METADATA.description,
  openGraph: {
    title: `${METADATA.title} • Open Silver`,
    description: METADATA.description,
    type: "website",
  },
};

export default function TokenTrackerPage() {
  return <LandingPage />;
}

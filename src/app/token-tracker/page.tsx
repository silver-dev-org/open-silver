import { METADATA } from "@/token-tracker/constants";
import { getTokenTrackerConfig } from "@/token-tracker/config";
import { Home } from "@/token-tracker/pages/index";
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

type Props = {
  searchParams: Promise<{ token?: string }>;
};

export default async function TokenTrackerPage({ searchParams }: Props) {
  const { isConfigured } = getTokenTrackerConfig();

  if (!isConfigured) {
    return <LandingPage />;
  }

  const { token } = await searchParams;
  return <Home initialToken={token} />;
}

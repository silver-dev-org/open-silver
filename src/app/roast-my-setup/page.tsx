import Home from "@/roast-my-setup/pages/index";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Roast My Setup",
  description: "Submit your setup and get a roast for improvement.",
  openGraph: {
    title: "Roast My Setup • Open Silver",
    description: "Show off your setup and get roasted for fun and improvement.",
    type: "website",
  },
};

export default function RoastMySetupPage() {
  return <Home />;
}

import { Metadata } from "next";
import BehavioralCheckerClient from "./client";

export const metadata: Metadata = {
  title: "Behavioral Checker",
  description:
    "Get instant feedback from answering classical behavioral questions to improve your interview skills.",
  openGraph: {
    title: "Behavioral Checker • Open Silver",
    description: "Practice and get feedback on behavioral interview questions",
    type: "website",
  },
};

export default function BehavioralCheckerPage() {
  return <BehavioralCheckerClient />;
}

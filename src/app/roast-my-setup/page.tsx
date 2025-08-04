"use client";

import { Metadata } from "next";
import Description from "@/components/description";
import Heading from "@/components/heading";
import Section from "@/components/section";
import Spacer from "@/components/spacer";
import { Button } from "@/components/ui/button";
import ErrorBadge from "@/resume-checker/components/error-badge";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export const metadata: Metadata = {
  title: "Roast My Setup",
  description: "Submit your setup and get a roast for improvement.",
  openGraph: {
    title: "Roast My Setup • Open Silver",
    description: "Show off your setup and get roasted for fun and improvement.",
    type: "website",
  },
};

export default function Home() {
  const router = useRouter();
  const [error, setError] = useState<Error | null>(null);

  const requestCameraAndMicrophone = () => {
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        router.push("/roast-my-setup/roaster");
      })
      .catch((err) => {
        setError(new Error("Access to microphone not granted."));
      });
  };

  return (
    <Section>
      <ErrorBadge error={error} />
      <Heading size="lg" center>
        <span className="text-primary">Roast</span> My{" "}
        <span className="text-primary">Setup</span>
      </Heading>

      <Description center>Get feedback from your setup.</Description>
      <Description center>Como te ven los demas?</Description>

      <div className="flex items-center justify-center pt-4">
        <Button
          variant="default"
          size="lg"
          onClick={requestCameraAndMicrophone}
        >
          Roast Me
        </Button>
      </div>

      <Spacer size="lg" />
      <div className="text-center">
        <Link href="/roast-my-setup/privacy" className="link">
          Política de Privacidad
        </Link>
      </div>
    </Section>
  );
}

"use client";

import Description from "@/components/description";
import Heading from "@/components/heading";
import Section from "@/components/section";
import Spacer from "@/components/spacer";
import { Button } from "@/components/ui/button";
import ErrorBadge from "@/resume-checker/components/error-badge";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

function usePasteEvent(pasteListener: (event: ClipboardEvent) => void) {
  useEffect(() => {
    document.addEventListener("paste", pasteListener);

    return () => {
      document.removeEventListener("paste", pasteListener);
    };
  }, [pasteListener]);
}

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
        <Link href="/resume-checker/privacy" className="link">
          Política de Privacidad
        </Link>
      </div>
    </Section>
  );
}

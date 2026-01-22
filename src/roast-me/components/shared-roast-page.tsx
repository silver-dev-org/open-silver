"use client";

import { Container } from "@/components/container";
import { Heading } from "@/components/heading";
import { Spacer } from "@/components/spacer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { RefreshCcw } from "lucide-react";
import Link from "next/link";
import type { RoastMetadata } from "../types";
import { MessageChat } from "./message-chat";
import { SnapshotDisplay } from "./snapshot-display";
import posthog from "posthog-js";
import { useEffect } from "react";

interface SharedRoastPageProps {
  metadata: RoastMetadata;
}

export function SharedRoastPage({ metadata }: SharedRoastPageProps) {
  const tryItYourselfUrl = metadata.isUnhinged
    ? "/roast-me/unhinged"
    : "/roast-me";

  useEffect(() => {
    const ageDays = metadata.createdAt
      ? Math.floor(
          (Date.now() - new Date(metadata.createdAt).getTime()) /
            (1000 * 60 * 60 * 24),
        )
      : undefined;

    posthog.capture("roast_me_shared_page_viewed", {
      mode: metadata.isUnhinged ? "unhinged" : "standard",
      score: metadata.analysis.score,
      green_flags_count: metadata.analysis.flags.green.length,
      yellow_flags_count: metadata.analysis.flags.yellow.length,
      red_flags_count: metadata.analysis.flags.red.length,
      age_days: ageDays,
    });
  }, [metadata]);

  return (
    <Container>
      <Heading lvl={1} center>
        {metadata.isUnhinged ? (
          <>
            <span className="text-primary">Roast</span> me <i>Unhinged</i>
          </>
        ) : (
          <>
            <span className="text-primary">Roast</span> me
          </>
        )}
      </Heading>
      <Spacer size="lg" />
      <div className="flex flex-col md:flex-row gap-6">
        <SnapshotDisplay
          className="md:w-2/3 mx-auto"
          snapshotUrl={metadata.snapshotUrl}
          score={metadata.analysis.score}
        />
        <Card className="md:w-1/3 h-[720px] max-h-[75vh] gap-0 pt-0">
          <CardContent className="flex flex-col gap-6 h-full overflow-y-scroll">
            <div />
            <MessageChat
              cameraStatus="frozen"
              data={metadata.analysis}
              isUnhinged={metadata.isUnhinged}
              showResults
              static
            />
            <div />
          </CardContent>
          <CardFooter className="flex gap-6 border-t">
            <Button variant="outline" className="flex-1" asChild>
              <Link href={tryItYourselfUrl}>
                <RefreshCcw />
                Try it yourself
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </Container>
  );
}

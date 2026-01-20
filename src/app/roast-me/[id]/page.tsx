import { Container } from "@/components/container";
import { Heading } from "@/components/heading";
import { Spacer } from "@/components/spacer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { list } from "@vercel/blob";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { RoastMetadata, Score } from "@/roast-me/types";

type Props = {
  params: Promise<{ id: string }>;
};

async function getMetadata(id: string): Promise<RoastMetadata | null> {
  try {
    const { blobs } = await list({ prefix: `roast-me/${id}/metadata.json` });
    if (blobs.length === 0) return null;

    const response = await fetch(blobs[0].url);
    if (!response.ok) return null;

    return response.json();
  } catch {
    return null;
  }
}

function StaticGtaOverlay({ score }: { score: Score }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
      {score === "pass" && <div className="absolute inset-0 bg-black/30" />}
      <div
        className={`relative z-10 font-gta text-center ${
          score === "pass" ? "text-amber-400" : "text-red-600"
        }`}
        style={{
          fontSize: "clamp(2rem, 10vw, 6rem)",
          textShadow:
            score === "pass"
              ? "4px 4px 0 #000, -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000"
              : "4px 4px 0 #000, -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 0 0 40px rgba(255, 0, 0, 0.8)",
          lineHeight: 1.1,
        }}
      >
        {score === "pass" ? (
          <>
            MISSION PASSED
            <br />
            <span className="text-[0.6em] text-white">RESPECT+</span>
          </>
        ) : (
          "ROASTED"
        )}
      </div>
    </div>
  );
}

export default async function Page({ params }: Props) {
  const { id } = await params;
  const metadata = await getMetadata(id);

  if (!metadata) {
    notFound();
  }

  return (
    <Container>
      <Heading lvl={1} center>
        <span className="text-primary">Roast</span> me
      </Heading>
      <Spacer size="lg" />
      <Card className="aspect-video overflow-hidden p-0 border-4 border-primary max-w-4xl mx-auto">
        <div className="relative w-full h-full">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={metadata.snapshotUrl}
            alt="Roast snapshot"
            className={`w-full h-full object-cover ${
              metadata.score === "fail" ? "grayscale" : ""
            }`}
          />
          <StaticGtaOverlay score={metadata.score} />
        </div>
      </Card>
      <Spacer size="lg" />
      <div className="flex justify-center">
        <Button asChild size="lg">
          <Link href="/roast-me">Try it yourself</Link>
        </Button>
      </div>
    </Container>
  );
}

import { SharedRoastPage } from "@/roast-me/components/shared-roast-page";
import type { RoastMetadata } from "@/roast-me/types";
import { list } from "@vercel/blob";
import { notFound } from "next/navigation";

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

export default async function Page({ params }: Props) {
  const { id } = await params;
  const metadata = await getMetadata(id);

  if (!metadata) {
    notFound();
  }

  return <SharedRoastPage metadata={metadata} />;
}

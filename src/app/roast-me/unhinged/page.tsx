import { Description } from "@/components/description";
import { Heading } from "@/components/heading";
import { Spacer } from "@/components/spacer";
import { RoastMe } from "@/roast-me";
import { METADATA } from "@/roast-me/constants";
import { pageMetadata } from "@/lib/seo";
import type { Metadata } from "next";

// Unhinged mode is shared by link and not meant to be found through search:
// noindex, no canonical (the two contradict), and absent from the sitemap.
const { alternates: _canonical, ...metadataWithoutCanonical } = pageMetadata({
  title: "Roast Me Unhinged: Brutal Setup Feedback",
  description:
    "How do other people see you on a video call? Snap your setup and get honest feedback on lighting, framing, and background before your next interview.",
  path: "/roast-me/unhinged",
  ogTitle: "Roast Me Unhinged • Open Silver",
  ogDescription: METADATA.description,
});

export const metadata: Metadata = {
  ...metadataWithoutCanonical,
  robots: { index: false, follow: true },
};

export default function Page() {
  return (
    <>
      <Heading lvl={1} center>
        <span className="text-primary">Roast</span> me <i>Unhinged</i>
      </Heading>
      <Spacer />
      <Description center>{METADATA.description}</Description>
      <Spacer size="lg" />
      <RoastMe />
    </>
  );
}

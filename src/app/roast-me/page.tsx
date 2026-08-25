import { Description } from "@/components/description";
import { Heading } from "@/components/heading";
import { Spacer } from "@/components/spacer";
import { RoastMe } from "@/roast-me";
import { METADATA } from "@/roast-me/constants";
import { pageMetadata } from "@/lib/seo";
import type { Metadata } from "next";

export const metadata: Metadata = pageMetadata({
  title: "Roast Me: Feedback on Your Video Call Setup",
  description:
    "How do other people see you on a video call? Snap your setup and get honest feedback on lighting, framing, and background before your next interview.",
  path: "/roast-me",
  ogTitle: "Roast Me • Open Silver",
  ogDescription: METADATA.description,
});

export default function Page() {
  return (
    <>
      <Heading lvl={1} center>
        <span className="text-primary">Roast</span> me
      </Heading>
      <Spacer />
      <Description center>{METADATA.description}</Description>
      <Spacer size="lg" />
      <RoastMe />
    </>
  );
}

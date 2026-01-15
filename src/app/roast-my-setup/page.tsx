import { Description } from "@/components/description";
import { Heading } from "@/components/heading";
import { Section } from "@/components/section";
import { Spacer } from "@/components/spacer";
import { RoastMySetup } from "@/roast-my-setup";
import { METADATA } from "@/roast-my-setup/constants";
import { Metadata } from "next";

export const metadata: Metadata = {
  ...METADATA,
  openGraph: {
    ...METADATA,
  },
};

export default function Page() {
  return (
    <Section>
      <Heading center>
        <span className="text-primary">Roast</span> my Setup
      </Heading>
      <Spacer />
      <Description center>{METADATA.description}</Description>
      <Spacer size="lg" />
      <div className="flex justify-center">
        <RoastMySetup />
      </div>
    </Section>
  );
}

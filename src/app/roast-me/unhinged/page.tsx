import { Container } from "@/components/container";
import { Description } from "@/components/description";
import { Heading } from "@/components/heading";
import { Spacer } from "@/components/spacer";
import { RoastMe } from "@/roast-me";
import { METADATA } from "@/roast-me/constants";
import { Metadata } from "next";

export const metadata: Metadata = {
  ...METADATA,
  openGraph: {
    ...METADATA,
  },
};

export default function Page() {
  return (
    <Container>
      <Heading lvl={1} center>
        <span className="text-primary">Roast</span> me <i>Unhinged</i>
      </Heading>
      <Spacer />
      <Description center>{METADATA.description}</Description>
      <Spacer size="lg" />
      <RoastMe />
    </Container>
  );
}

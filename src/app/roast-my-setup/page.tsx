import { Description } from "@/components/description";
import { Heading } from "@/components/heading";
import { QueryClientWrapper } from "@/components/query-client-wrapper";
import { Container } from "@/components/container";
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
    <Container>
      <Heading lvl={1} center>
        <span className="text-primary">Roast</span> my Setup
      </Heading>
      <Spacer />
      <Description center>{METADATA.description}</Description>
      <Spacer size="lg" />
      <QueryClientWrapper>
        <RoastMySetup />
      </QueryClientWrapper>
    </Container>
  );
}

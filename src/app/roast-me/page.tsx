import { Description } from "@/components/description";
import { Heading } from "@/components/heading";
import { Spacer } from "@/components/spacer";
import { RoastMe } from "@/roast-me";
import { METADATA } from "@/roast-me/constants";

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

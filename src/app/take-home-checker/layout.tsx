import { Description } from "@/components/description";
import { Heading } from "@/components/heading";
import { QueryClientWrapper } from "@/components/query-client-wrapper";
import { Section } from "@/components/section";
import { Spacer } from "@/components/spacer";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <Section>
      <Heading size="lg" center>
        <span className="text-primary">Take-home</span> Checker
      </Heading>
      <Spacer />
      <Description center>
        Upload your take-home and get instant feedback on the project.
      </Description>
      <Spacer size="lg" />
      <QueryClientWrapper>{children}</QueryClientWrapper>
    </Section>
  );
}

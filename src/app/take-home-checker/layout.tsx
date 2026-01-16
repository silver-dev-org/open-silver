import { Container } from "@/components/container";
import { Description } from "@/components/description";
import { Heading } from "@/components/heading";
import { Spacer } from "@/components/spacer";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <Container>
      <Heading lvl={1} center>
        <span className="text-primary">Take-home</span> Checker
      </Heading>
      <Spacer />
      <Description center>
        Upload your take-home and get instant feedback on the project.
      </Description>
      <Spacer size="lg" />
      {children}
    </Container>
  );
}

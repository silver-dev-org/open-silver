import { Container } from "@/components/container";

export function Section(props: React.ComponentProps<"section">) {
  return (
    <Container asChild>
      <section {...props} />
    </Container>
  );
}

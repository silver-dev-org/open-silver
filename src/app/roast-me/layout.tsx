import { Container } from "@/components/container";

export default function Layout({ children }: { children: React.ReactNode }) {
  return <Container>{children}</Container>;
}

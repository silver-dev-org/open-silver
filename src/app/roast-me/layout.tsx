import { Container } from "@/components/container";
import { METADATA } from "@/roast-me/constants";
import { Metadata } from "next";

export const metadata: Metadata = {
  ...METADATA,
  openGraph: {
    ...METADATA,
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <Container>{children}</Container>;
}

import Container from "@/components/container";
import Heading from "@/components/heading";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";

const tools: {
  section: string;
  list: {
    title: string;
    href: string;
  }[];
}[] = [
  {
    section: "For talent",
    list: [
      {
        title: "Resume Checker",
        href: "/resume-checker",
      },
      {
        title: "Behavioral Checker",
        href: "/behavioral-checker",
      },
      {
        title: "Take-home Checker",
        href: "/take-home-checker",
      },
    ],
  },
  {
    section: "For companies",
    list: [
      {
        title: "Contract Negotiation Tool",
        href: "/contract",
      },
    ],
  },
];

export default function Home() {
  return (
    <Container>
      <Heading
        center
        description="Open Source Software made by Silver.dev and its contributors."
      >
        <span className="text-primary">Open</span> Silver
      </Heading>
      {tools.map(({ section, list }) => (
        <section key={section} className="space-y-8">
          <Heading size="lg">{section}</Heading>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {list.map(({ title, href }) => (
              <Link
                href={href}
                key={href}
                prefetch={true}
                className={cn(
                  buttonVariants({ variant: "outline" }),
                  "text-4xl p-16"
                )}
              >
                <section>
                  <h1>{title}</h1>
                </section>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </Container>
  );
}

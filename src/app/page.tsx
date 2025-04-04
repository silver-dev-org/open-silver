import Description from "@/components/description";
import Grid from "@/components/grid";
import Heading from "@/components/heading";
import Section from "@/components/section";
import Space from "@/components/space";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import Link from "next/link";

const tools: {
  section: React.ReactNode;
  slug: string;
  list: {
    title: string;
    description: string;
    href: string;
  }[];
}[] = [
  {
    slug: "for-talent",
    section: (
      <span>
        For <span className="text-primary">talent</span>
      </span>
    ),
    list: [
      {
        title: "Resume Checker",
        description: "Subí tu CV y recibí feedback inmediato.",
        href: "/resume-checker",
      },
      {
        title: "Behavioral Checker",
        description:
          "Get instant feedback from answering classical behavioral questions.",
        href: "/behavioral-checker",
      },
      {
        title: "Take-home Checker",
        description:
          "Upload your take-home and get instant feedback on the project.",
        href: "/take-home-checker",
      },
      {
        title: "WPM Game",
        description: "Test your speed and practice typing code.",
        href: "https://wpm.silver.dev",
      },
    ],
  },
  {
    slug: "for-employers",
    section: (
      <span>
        For <span className="text-primary">employers</span>
      </span>
    ),
    list: [
      {
        title: "Fees Calculator",
        description:
          "Adjust terms, explore options, and share your estimate with Silver.",
        href: "/fees-calculator",
      },
    ],
  },
];

export default function Home() {
  return (
    <Section>
      <Heading size="lg" center>
        <span className="text-primary">Open</span> Silver
      </Heading>
      <Space />
      <Description center>
        Open Source Software made by Silver.dev and its contributors.
      </Description>
      {tools.map(({ slug, section, list }, index) => (
        <Section key={index} id={slug} space={null}>
          <Space size="lg" />
          <Heading>{section}</Heading>
          <Space />
          <Grid>
            {list.map(({ title, description, href }) => (
              <Link href={href} key={href} prefetch={true}>
                <Card className="hover:bg-foreground/10 transition-all duration-300">
                  <CardHeader>
                    <CardTitle>{title}</CardTitle>
                    <CardDescription>{description}</CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </Grid>
        </Section>
      ))}
    </Section>
  );
}

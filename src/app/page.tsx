import Description from "@/components/description";
import Grid from "@/components/grid";
import Heading from "@/components/heading";
import Section from "@/components/section";
import Spacer from "@/components/spacer";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  description:
    "Open Source Software made by Silver.dev and its contributors. Explore our collection of tools for talent and employers.",
  openGraph: {
    title: "Open Silver",
    description: "Open Source Software made by Silver.dev and its contributors",
    type: "website",
  },
};

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
        For <span className="text-primary">Talent</span>
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
        title: "Github Repo",
        description:
          "A repository with dozens of challenges for interview practice",
        href: "http://silver.dev/repo",
      },
      // Not ready yet
      // {
      //   title: "Take-home Checker",
      //   description:
      //     "Upload your take-home and get instant feedback on the project.",
      //   href: "/take-home-checker",
      // },
      // {
      //   title: "WPM Game",
      //   description: "Test your speed and practice typing code.",
      //   href: "https://wpm.silver.dev",
      // },
    ],
  },
  {
    slug: "for-employers",
    section: (
      <span>
        For <span className="text-primary">Employers</span>
      </span>
    ),
    list: [
      {
        title: "Fees Calculator",
        description:
          "Adjust terms, explore options, and share your estimate with Silver.",
        href: "/fees-calculator",
      },
      {
        title: "Model Agreement",
        description: "See our standard agreement",
        href: "/contract",
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
      <Spacer />
      <Description center>
        Open Source Software made by Silver.dev and its contributors.
      </Description>
      {tools.map(({ slug, section, list }, index) => (
        <Section key={index} id={slug} space={null}>
          <Spacer size="lg" />
          <Heading>{section}</Heading>
          <Spacer />
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

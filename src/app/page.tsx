import Description from "@/components/description";
import Grid from "@/components/grid";
import Heading from "@/components/heading";
import Section from "@/components/section";
import Spacer, { spaceSizes } from "@/components/spacer";
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
        description: "Upload your CV and get instant feedback to improve your job application.",
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
        title: "GitHub Repo",
        description:
          "A repository with dozens of challenges for interview practice.",
        href: "http://silver.dev/repo",
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
        description: "See our standard agreement.",
        href: "https://silver.dev/contract",
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
      <Spacer size="lg" />
      <div className={`flex flex-col ${spaceSizes.lg.gap}`}>
        {tools.map(({ slug, section, list }, index) => (
          <Section key={index} id={slug}>
            <Heading>{section}</Heading>
            <Spacer />
            <Grid>
              {list.map(({ title, description, href }) => (
                <Link href={href} key={href} prefetch={true}>
                  <Card className="hover:bg-foreground/10 transition-all size-full duration-300">
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
      </div>
    </Section>
  );
}

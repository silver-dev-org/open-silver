import { Description } from "@/components/description";
import { Grid } from "@/components/grid";
import { Heading } from "@/components/heading";
import { Container } from "@/components/container";
import { Spacer, spacing } from "@/components/spacer";
import { ToolCard, ToolCardProps } from "@/components/tool-card";
import { cn } from "@/lib/utils";
import { METADATA as ROAST_MY_SETUP_METADATA } from "@/roast-my-setup/constants";
import { Metadata } from "next";

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
  list: ToolCardProps[];
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
        description:
          "Upload your CV and get instant feedback to improve your job application.",
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
      // {
      //   ...ROAST_MY_SETUP_METADATA,
      //   href: "/roast-my-setup",
      // },
      {
        title: "Practice Repo",
        description:
          "A repository with dozens of challenges for interview practice.",
        href: "http://silver.dev/repo",
      },
      {
        title: "Open Silver Repo",
        description: "Source code of this website and its apps.",
        href: "https://github.com/silver-dev-org/open-silver",
      },
    ],
  },
  {
    slug: "for-companies",
    section: (
      <span>
        For <span className="text-primary">Companies</span>
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
        title: "Salary Calculator",
        description:
          "Understand salary costs in Argentina, comparing EOR vs AOR.",
        href: "/salary-calculator",
      },
      {
        title: "Model Agreement",
        description: "See our standard agreement.",
        href: "https://silver.dev/contract",
      },
      {
        title: "Invoice Generator",
        description:
          "Generate invoices for SilverEd or as a Silver.dev Interviewer.",
        href: "/invoice-generator",
      },
    ],
  },
];

export default function Home() {
  return (
    <Container>
      <Heading lvl={1} center>
        <span className="text-primary">Open</span> Silver
      </Heading>
      <Spacer />
      <Description center>
        Open Source Software made by Silver.dev and its contributors.
      </Description>
      <Spacer size="lg" />
      <div className={cn("flex flex-col", spacing.lg.gap)}>
        {tools.map(({ slug, section, list }, index) => (
          <Container key={index} id={slug}>
            <Heading lvl={2}>{section}</Heading>
            <Spacer />
            <Grid>
              {list.map((props, i) => (
                <ToolCard key={i} {...props} />
              ))}
            </Grid>
          </Container>
        ))}
      </div>
    </Container>
  );
}

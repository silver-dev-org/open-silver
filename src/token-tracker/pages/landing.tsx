import { Container } from "@/components/container";
import { Description } from "@/components/description";
import { Heading, Subheading } from "@/components/heading";
import { Spacer } from "@/components/spacer";
import { Button } from "@/components/ui/button";
import { PROVIDER_CONFIG } from "@/token-tracker/constants";

const DEPLOY_URL =
  "https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fsilver-dev-org%2Fopen-silver";

const GITHUB_URL = "https://github.com/silver-dev-org/open-silver";

const steps = [
  {
    number: "01",
    title: "Deploy your own instance",
    description:
      "Clone and deploy this repo to Vercel in one click. Configure the required environment variables in your project settings.",
  },
  {
    number: "02",
    title: "Share the submit link",
    description:
      "Send team members a link with a submit token. They enter their work email and a read-only API key for each provider they use.",
  },
  {
    number: "03",
    title: "Keys are encrypted and stored",
    description:
      "API keys are encrypted with AES-256 and stored in Vercel Blob. Usage data never leaves your own Vercel project.",
  },
  {
    number: "04",
    title: "Usage refreshes automatically",
    description:
      "A cron job polls provider APIs every few hours and updates each team member's token consumption. View totals in the dashboard.",
  },
];

export function LandingPage() {
  return (
    <Container>
      <div className="flex flex-col items-center text-center">
        <Heading lvl={1} center>
          <span className="text-primary">Token</span> Tracker
        </Heading>
        <Spacer />
        <Description center>
          A self-hosted internal tool for teams to track AI token usage across
          Anthropic, OpenAI, Gemini, and Grok.
        </Description>
        <Spacer />
        <p className="text-sm text-muted-foreground max-w-sm text-balance">
          The public Open Silver deployment is a reference implementation only
          — not a shared hosted service. Deploy your own instance to use it
          with your team.
        </p>
        <Spacer />
        <div className="flex gap-3 flex-wrap justify-center">
          <a href={DEPLOY_URL} target="_blank" rel="noopener noreferrer">
            <Button size="lg">Deploy to Vercel</Button>
          </a>
          <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="lg">
              View on GitHub
            </Button>
          </a>
        </div>
      </div>

      <Spacer size="lg" />

      <div className="flex flex-col gap-6">
        <Heading lvl={2}>
          How it <span className="text-primary">works</span>
        </Heading>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {steps.map((step) => (
            <div
              key={step.number}
              className="flex gap-4 rounded-lg border border-border p-5"
            >
              <span className="text-primary font-mono text-lg font-bold shrink-0 leading-none pt-0.5">
                {step.number}
              </span>
              <div className="flex flex-col gap-1.5">
                <p className="font-medium">{step.title}</p>
                <p className="text-sm text-muted-foreground">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Spacer size="lg" />

      <div className="flex flex-col gap-6">
        <Heading lvl={2}>
          Supported <span className="text-primary">providers</span>
        </Heading>
        <div className="flex flex-wrap gap-3">
          {(
            Object.entries(PROVIDER_CONFIG) as [
              string,
              (typeof PROVIDER_CONFIG)[keyof typeof PROVIDER_CONFIG],
            ][]
          ).map(([key, config]) => (
            <div
              key={key}
              className="flex items-center gap-2.5 rounded-lg border border-border px-4 py-3"
            >
              <span className="font-medium">{config.label}</span>
              <span className="text-xs text-muted-foreground">
                {config.hasUsageApi ? "Usage API" : "Display only"}
              </span>
            </div>
          ))}
        </div>
        <p className="text-sm text-muted-foreground max-w-prose">
          Providers marked &ldquo;Display only&rdquo; do not expose a historical
          usage API — token counts are only available per-request in their
          response metadata.
        </p>
      </div>

      <Spacer size="lg" />

      <div className="rounded-lg bg-muted p-8 flex flex-col gap-4">
        <Heading lvl={2}>
          Self-<span className="text-primary">hosted</span>
        </Heading>
        <Subheading>Why does each organization deploy their own?</Subheading>
        <div className="flex flex-col gap-3 text-sm text-muted-foreground max-w-prose">
          <p>
            Token Tracker is designed to be deployed independently by each
            organization. Your team&apos;s API keys and usage data live entirely
            within your own Vercel project — we never see it.
          </p>
          <p>
            Each instance is isolated. There is no central database, no shared
            accounts, and no usage data crossing organizational boundaries. You
            own the encryption key, the storage, and the dashboard password.
          </p>
        </div>
      </div>
    </Container>
  );
}

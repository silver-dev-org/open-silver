import { Container } from "@/components/container";
import { Description } from "@/components/description";
import { Heading } from "@/components/heading";
import { Spacer } from "@/components/spacer";
import { Button } from "@/components/ui/button";

const DEPLOY_URL =
  "https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fsilver-dev-org%2Fopen-silver";

const GITHUB_URL = "https://github.com/silver-dev-org/open-silver";

const configJson = `{
  "mcpServers": {
    "silver-tracker": {
      "command": "npx",
      "args": ["-y", "@ftaboadac/silver-tracker-mcp"]
    }
  }
}`;

const installCards = [
  {
    label: "Claude Code",
    sublabel: null,
    code: "claude mcp add silver-tracker --\nnpx -y @ftaboadac/silver-tracker-mcp",
  },
  {
    label: "Codex CLI",
    sublabel: null,
    code: "codex mcp add silver-tracker --\nnpx -y @ftaboadac/silver-tracker-mcp",
  },
  {
    label: "Cursor / Gemini CLI",
    sublabel: "~/.cursor/mcp.json or ~/.gemini/settings.json",
    code: configJson,
  },
  {
    label: "CLI fallback",
    sublabel: "Any environment without MCP support",
    code: "npx -y @ftaboadac/silver-tracker",
  },
];

function CodeBlock({ children }: { children: string }) {
  return (
    <pre className="flex-1 rounded-lg border border-border bg-background px-4 py-3 font-mono text-xs text-foreground overflow-x-auto whitespace-pre-wrap break-all">
      <code>{children}</code>
    </pre>
  );
}

export function LandingPage() {
  return (
    <Container>
      <section className="flex flex-col items-center text-center max-w-2xl mx-auto">
        <Heading lvl={1} center>
          <span className="text-primary">Token</span> Tracker
        </Heading>
        <Spacer />
        <Description center>
          Track AI token usage across your team&apos;s coding tools —
          self-hosted, no API keys required.
        </Description>
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
      </section>

      <Spacer size="lg" />

      <section className="flex flex-col gap-6 max-w-4xl mx-auto w-full">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground text-center">
          Install
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {installCards.map((card) => (
            <div
              key={card.label}
              className="flex flex-col gap-3 rounded-lg border border-border p-5"
            >
              <div className="flex flex-col gap-0.5">
                <p className="font-medium text-sm">{card.label}</p>
                {card.sublabel && (
                  <p className="text-xs text-muted-foreground">{card.sublabel}</p>
                )}
              </div>
              <CodeBlock>{card.code}</CodeBlock>
            </div>
          ))}
        </div>
      </section>

      <Spacer size="lg" />

      <section className="rounded-2xl bg-muted p-8 max-w-4xl mx-auto w-full">
        <div className="flex flex-col md:flex-row gap-8 md:gap-12">
          <div className="flex flex-col gap-4 flex-1">
            <Heading lvl={2}>
              Self-<span className="text-primary">hosted</span>
            </Heading>
            <div className="flex flex-col gap-3 text-sm text-muted-foreground">
              <p>
                Each organization deploys their own instance. Usage data lives
                entirely within your own Vercel project — we never see it.
              </p>
              <p>
                Collectors read local log files from Claude Code, Codex CLI,
                and Gemini CLI. No provider admin keys required. Reports are
                stored in your own Vercel Blob store, behind a
                password-protected dashboard.
              </p>
            </div>
            <div className="flex gap-3 flex-wrap">
              <a href={DEPLOY_URL} target="_blank" rel="noopener noreferrer">
                <Button>Deploy to Vercel</Button>
              </a>
              <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer">
                <Button variant="outline">View on GitHub</Button>
              </a>
            </div>
          </div>

          <div className="flex flex-col gap-2 shrink-0">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Supported sources
            </p>
            <ul className="flex flex-col gap-1 text-sm">
              <li>Claude Code</li>
              <li>Codex CLI</li>
              <li>Gemini CLI</li>
              <li className="text-muted-foreground italic text-xs mt-1">
                Cursor 3.1+ no longer exposes local token data — see README
              </li>
            </ul>
          </div>
        </div>
      </section>
    </Container>
  );
}

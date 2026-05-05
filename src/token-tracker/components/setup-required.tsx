import { Container } from "@/components/container";
import { Heading } from "@/components/heading";
import { Spacer } from "@/components/spacer";
import { Button } from "@/components/ui/button";

const DEPLOY_URL =
  "https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fopen-silver%2Fopen-silver";

const DOCS_URL =
  "https://github.com/open-silver/open-silver/blob/main/src/token-tracker/README.md";

interface SetupRequiredProps {
  missingVars?: string[];
}

export function SetupRequired({ missingVars }: SetupRequiredProps) {
  return (
    <Container>
      <Heading lvl={2} center>
        Self-Hosted <span className="text-primary">Setup Required</span>
      </Heading>
      <Spacer />
      <div className="max-w-md mx-auto flex flex-col gap-6">
        <div className="flex flex-col gap-3 text-sm text-muted-foreground">
          <p>
            Token Tracker is an internal team utility designed to be
            self-hosted. Each organization deploys their own isolated instance
            — usage data never leaves your Vercel project.
          </p>
          <p>
            The public Open Silver deployment is a reference implementation
            only. To use Token Tracker, deploy your own instance and configure
            the required environment variables.
          </p>
        </div>

        {missingVars && missingVars.length > 0 && (
          <div className="rounded-lg border border-border p-4 flex flex-col gap-3">
            <p className="text-sm font-medium">Missing environment variables</p>
            <ul className="flex flex-col gap-1.5">
              {missingVars.map((v) => (
                <li key={v} className="font-mono text-xs text-muted-foreground">
                  {v}
                </li>
              ))}
            </ul>
            <p className="text-xs text-muted-foreground">
              Set these in your Vercel project settings or local{" "}
              <span className="font-mono">.env</span> file, then redeploy.
            </p>
          </div>
        )}

        <div className="flex flex-col gap-2">
          <a href={DEPLOY_URL} target="_blank" rel="noopener noreferrer">
            <Button className="w-full">Deploy to Vercel</Button>
          </a>
          <a href={DOCS_URL} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" className="w-full">
              Setup Instructions
            </Button>
          </a>
        </div>
      </div>
    </Container>
  );
}

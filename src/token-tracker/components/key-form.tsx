"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { PROVIDER_CONFIG } from "@/token-tracker/constants";
import { UsageSummary } from "@/token-tracker/components/usage-summary";
import type { Provider, SubmitRequest, SubmitState } from "@/token-tracker/types";
import { useState } from "react";

const PROVIDERS = Object.entries(PROVIDER_CONFIG) as [
  Provider,
  (typeof PROVIDER_CONFIG)[Provider],
][];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface KeyFormProps {
  initialToken?: string;
}

export function KeyForm({ initialToken }: KeyFormProps) {
  const [email, setEmail] = useState("");
  const [provider, setProvider] = useState<Provider>("anthropic");
  const [apiKey, setApiKey] = useState("");
  const [teamToken, setTeamToken] = useState(initialToken ?? "");
  const [state, setState] = useState<SubmitState>({ status: "idle" });

  const config = PROVIDER_CONFIG[provider];
  const supportsUsage = config.hasUsageApi;
  const isValidEmail = EMAIL_RE.test(email.trim().toLowerCase());

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setState({ status: "loading" });

    const body: SubmitRequest = {
      email: email.trim().toLowerCase(),
      provider,
      apiKey,
      teamToken,
    };

    try {
      const res = await fetch("/token-tracker/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const { error } = await res.json();
        setState({
          status: "error",
          message: error ?? "Something went wrong.",
        });
        return;
      }

      const { email: returnedEmail, result } = await res.json();
      setApiKey("");
      setState({ status: "success", email: returnedEmail, result });
    } catch {
      setState({
        status: "error",
        message: "Network error. Please try again.",
      });
    }
  }

  const isLoading = state.status === "loading";
  const canSubmit =
    supportsUsage &&
    isValidEmail &&
    apiKey.length > 0 &&
    teamToken.length > 0;

  return (
    <div className="flex flex-col gap-6 w-full max-w-md mx-auto">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">Work email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
            required
            disabled={isLoading}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Provider</Label>
          <div className="grid grid-cols-2 gap-2">
            {PROVIDERS.map(([value, cfg]) => (
              <button
                key={value}
                type="button"
                onClick={() => {
                  setProvider(value);
                  setApiKey("");
                  setState({ status: "idle" });
                }}
                disabled={isLoading}
                className={cn(
                  "py-2 px-4 rounded-lg border text-sm font-medium transition-colors",
                  provider === value
                    ? "border-foreground bg-foreground text-background"
                    : "border-border hover:border-foreground/50",
                )}
              >
                {cfg.label}
              </button>
            ))}
          </div>
        </div>
        {supportsUsage && config.hasUsageApi ? (
          <>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="api-key">API Key</Label>
              <Input
                id="api-key"
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={config.placeholder}
                required
                disabled={isLoading}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="team-token">Team token</Label>
              <Input
                id="team-token"
                type="password"
                value={teamToken}
                onChange={(e) => setTeamToken(e.target.value)}
                placeholder="Provided by your team admin"
                required
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground">
                Ask your team admin for the team token. It authorizes usage
                submissions to this instance.
              </p>
            </div>
            <Button
              type="submit"
              disabled={isLoading || !canSubmit}
              className={cn(isLoading && "opacity-75")}
            >
              {isLoading ? "Fetching usage…" : "Fetch Usage"}
            </Button>
          </>
        ) : (
          <p className="text-sm text-muted-foreground border border-border rounded-lg p-4">
            {"noUsageApiMessage" in config && config.noUsageApiMessage}
          </p>
        )}
      </form>

      {state.status === "error" && (
        <p className="text-destructive text-sm text-center">{state.message}</p>
      )}

      {state.status === "success" && (
        <UsageSummary email={state.email} result={state.result} />
      )}
    </div>
  );
}

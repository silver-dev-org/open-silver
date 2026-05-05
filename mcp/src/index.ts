#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { readConfig } from "../../cli/src/config.js";
import { collectUsage } from "../../cli/src/collector.js";
import { postReport } from "../../cli/src/reporter.js";
import type { UserReport } from "../../cli/src/types.js";

const InputSchema = z.object({});

const server = new Server(
  { name: "silver-tracker", version: "0.1.0" },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "report_token_usage",
      description:
        "Collect AI token usage from local tools (Claude Code, Cursor, Codex, Gemini CLI) and report it to the Silver Tracker dashboard.",
      inputSchema: {
        type: "object",
        properties: {},
        required: [],
      },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name !== "report_token_usage") {
    throw new Error(`Unknown tool: ${request.params.name}`);
  }

  InputSchema.parse(request.params.arguments ?? {});

  const config = await readConfig();
  if (!config) {
    return {
      content: [
        {
          type: "text" as const,
          text: "No Silver Tracker config found at ~/.silver-tracker/config.json. Run `silver-tracker sync` once to set up credentials.",
        },
      ],
    };
  }

  const sources = await collectUsage();

  if (sources.length === 0) {
    return {
      content: [
        {
          type: "text" as const,
          text: "No usage data detected. Make sure you have used Claude Code, Cursor, Codex CLI, or Gemini CLI on this machine.",
        },
      ],
    };
  }

  const report: UserReport = {
    email: config.email,
    sources,
    updatedAt: new Date().toISOString(),
  };

  try {
    await postReport(config, report);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      content: [
        {
          type: "text" as const,
          text: `Failed to report token usage: ${message}`,
        },
      ],
    };
  }

  const sourceSummaries = sources.map((s) => {
    const totalTokens = s.models.reduce(
      (sum, m) => sum + m.inputTokens + m.outputTokens + m.cacheReadTokens + m.cacheWriteTokens,
      0
    );
    const totalCost = s.models.reduce((sum, m) => sum + m.costUsd, 0);
    const tokensK = Math.round(totalTokens / 1000);
    return `${s.source} (${tokensK}K tokens, $${totalCost.toFixed(2)})`;
  });

  const totalCost = sources.reduce(
    (sum, s) => sum + s.models.reduce((ms, m) => ms + m.costUsd, 0),
    0
  );

  return {
    content: [
      {
        type: "text" as const,
        text: `Reported token usage to Silver Tracker. Sources: ${sourceSummaries.join(", ")}. Total: $${totalCost.toFixed(2)}`,
      },
    ],
  };
});

const transport = new StdioServerTransport();
await server.connect(transport);

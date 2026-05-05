import { getTokenTrackerConfig } from "@/token-tracker/config";
import { runRefreshAll } from "@/token-tracker/refresh";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { isConfigured } = getTokenTrackerConfig();
  if (!isConfigured) {
    return NextResponse.json(
      {
        error:
          "Token Tracker is not configured on this instance. Deploy your own instance to use this feature.",
      },
      { status: 503 },
    );
  }

  const authHeader = req.headers.get("authorization");
  if (
    !process.env.CRON_SECRET ||
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const outcomes = await runRefreshAll();

  return NextResponse.json({
    refreshed: outcomes.filter((o) => o.status === "ok").length,
    failed: outcomes.filter((o) => o.status === "error").length,
    outcomes,
  });
}

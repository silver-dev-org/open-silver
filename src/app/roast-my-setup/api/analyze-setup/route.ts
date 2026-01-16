import {
  AnalyzeSetupRequest,
  AnalyzeSetupResponse,
} from "@/roast-my-setup/types";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const { snapshot } = (await request.json()) as AnalyzeSetupRequest;

  // TODO: Use the snapshot for analysis
  console.log("Received snapshot:", snapshot.slice(0, 50) + "...");

  await new Promise((resolve) => setTimeout(resolve, 5000));

  const mockData: AnalyzeSetupResponse = {
    score: "Fail",
    greenFlags: ["Good headphones"],
    yellowFlags: ["Inconsistent lighting", "Poor camera angle"],
    redFlags: ["Untidy room", "Alcohol in the table"],
  };

  return NextResponse.json(mockData);
}

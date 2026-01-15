import {
  AnalyzeSetupRequest,
  AnalyzeSetupResponse,
} from "@/roast-my-setup/types";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const { snapshot } = (await request.json()) as AnalyzeSetupRequest;

  // TODO: Use the snapshot for analysis
  console.log("Received snapshot:", snapshot.slice(0, 50) + "...");

  const mockData: AnalyzeSetupResponse = {
    score: "Fail",
  };

  return NextResponse.json(mockData);
}

import {
  AnalyzeSetupRequest,
  AnalyzeSetupResponse,
} from "@/roast-my-setup/types";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const { snapshot } = (await request.json()) as AnalyzeSetupRequest;

  // TODO: Use the snapshot for analysis
  console.log("Received snapshot:", snapshot.slice(0, 50) + "...");

  await new Promise((resolve) => setTimeout(resolve, 1));

  const mockData: AnalyzeSetupResponse = {
    score: "roasted",
    greenFlags: ["Good headphones"],
    yellowFlags: ["Inconsistent lighting", "Poor camera angle"],
    redFlags: ["Untidy room", "Alcohol in the table"],
    actionPlanSteps: [
      "Clean up the room",
      "Remove alcohol from the table asdfjl faklsdfl sd;fkl;sad lkf daskjl fkl;asd fksldk k l;askdfjl jasklfk;s kjla jlks",
      "lorem ipsum",
      "lorem ipsum",
      "lorem ipsum",
      "lorem ipsum",
      "lorem ipsum",
      "lorem ipsum",
      "lorem ipsum",
      "lorem ipsum",
      "lorem ipsum",
      "lorem ipsum",
      "lorem ipsum",
      "lorem ipsum",
      "lorem ipsum",
      "lorem ipsum",
      "lorem ipsum",
      "lorem ipsum",
      "lorem ipsum",
      "lorem ipsum",
      "lorem ipsum",
      "lorem ipsum",
      "lorem ipsum",
      "lorem ipsum",
      "lorem ipsum",
      "lorem ipsum",
      "lorem ipsum",
      "lorem ipsum",
      "lorem ipsum",
      "lorem ipsum",
      "lorem ipsum",
      "lorem ipsum",
      "lorem ipsum",
      "lorem ipsum",
      "lorem ipsum",
      "lorem ipsum",
      "lorem ipsum",
    ],
  };

  return NextResponse.json(mockData);
}

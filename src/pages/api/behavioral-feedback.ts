import type { NextApiRequest, NextApiResponse } from "next";
import {
  addFeedbackToNotion,
  updateFeedbackInNotion,
} from "../../behavioral-checker/notion/database";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const { pageId, feedbackScore, ...feedbackData } = req.body;

    if (!feedbackScore) {
      return res.status(400).json({ message: "Feedback score is required" });
    }

    let recordId: string;

    if (pageId) {
      await updateFeedbackInNotion(pageId, feedbackScore);
      recordId = pageId;
    } else {
      recordId = await addFeedbackToNotion({
        ...feedbackData,
        feedbackScore,
      });
    }

    return res.status(200).json({ success: true, pageId: recordId });
  } catch (error: any) {
    console.error("Error processing feedback:", error);
    return res.status(500).json({ message: error.message });
  }
}

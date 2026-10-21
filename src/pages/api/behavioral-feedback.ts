import type { NextApiRequest, NextApiResponse } from "next";
import {
  addFeedbackToNotion,
  updateFeedbackInNotion,
} from "../../behavioral-checker/notion/database";
import { createRouteLog } from "@/lib/route-log";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const log = createRouteLog("/api/behavioral-feedback");
  if (req.method !== "POST") {
    log.info("method_not_allowed");
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const { pageId, feedbackScore, feedbackText, ...feedbackData } = req.body;

    if (!feedbackScore) {
      log.info("bad_request");
      return res.status(400).json({ message: "Feedback score is required" });
    }

    let recordId: string;

    if (pageId) {
      await updateFeedbackInNotion(pageId, feedbackScore, feedbackText);
      recordId = pageId;
    } else {
      recordId = await addFeedbackToNotion({
        ...feedbackData,
        feedbackScore,
        feedbackText,
      });
    }

    log.info(pageId ? "updated" : "created");
    return res.status(200).json({ success: true, pageId: recordId });
  } catch (error) {
    log.unexpected(error);
    return res.status(500).json({ message: "Could not save your feedback." });
  }
}

import { consultByAudio } from "@/behavioral-checker/client-assistance/core/actions/ConsultByAudio";
import { InvalidModelResponseError } from "@/behavioral-checker/client-assistance/infrastructure/OpenAISdkAIClient";
import {
  addFeedbackToNotion,
  NotionOperationError,
} from "@/behavioral-checker/notion/database";
import { createRouteLog, describeError, type RouteLog } from "@/lib/route-log";
import { promises as fs } from "fs";
import multer from "multer";
import { NextApiRequest, NextApiResponse } from "next";
import os from "os";
import path from "path";

const storage = multer.diskStorage({
  destination: os.tmpdir(),
  filename: (_, file, cb) => {
    const extension = path.extname(file.originalname) || ".wav";
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${extension}`;
    cb(null, uniqueName);
  },
});

const upload = multer({ storage });

const handler = async (
  req: NextApiRequest,
  res: NextApiResponse,
  log: RouteLog,
) => {
  try {
    if (req.method !== "POST") {
      log.info("method_not_allowed");
      return res.status(405).json({ error: "Method not allowed" });
    }

    const file = (req as any).file;
    if (!file) {
      log.info("no_file");
      return res.status(400).json({ error: "No file uploaded" });
    }

    const filePath = path.join(os.tmpdir(), file.filename);
    const id = req.body.id as string;
    const question = req.body.question as string;
    log.set({ questionId: id });

    const result = await consultByAudio.invoke(id, question, filePath, log);

    try {
      log.phase("notion");
      await addFeedbackToNotion(result);
    } catch (error) {
      log.warn("notion_write_failed", {
        "notion.operation": "addFeedbackToNotion",
        "notion.timed_out":
          error instanceof NotionOperationError && error.timedOut,
        error: describeError(error),
      });
      return res.status(202).json({ ...result, notionPersisted: false });
    }

    log.info("success");
    res.status(200).json(result);
  } catch (error) {
    if (error instanceof InvalidModelResponseError) {
      log.error("invalid_model_response", { error: describeError(error) });
      res.status(502).json({ error: "invalid_model_response" });
    } else {
      log.unexpected(error);
      res.status(500).json({ error: "Error processing audio" });
    }
  } finally {
    const filename = (req as any).file?.filename;
    if (filename) {
      try {
        await fs.unlink(path.join(os.tmpdir(), filename));
      } catch (error) {
        console.error("Error deleting temporary file:", error);
      }
    }
  }
};

const middleware = upload.single("audio");
const multerMiddleware = (req: any, res: any, log: RouteLog, next: any) =>
  middleware(req, res, (err) => {
    if (err) {
      log.error("upload_error", { error: describeError(err) });
      return res.status(500).json({ error: "File upload error" });
    }
    next();
  });

export const config = {
  api: {
    bodyParser: false,
  },
};

export default (req: NextApiRequest, res: NextApiResponse) => {
  const log = createRouteLog<"transcribe" | "consult" | "notion">(
    "/api/analysis",
  );
  return multerMiddleware(req, res, log, () => handler(req, res, log));
};

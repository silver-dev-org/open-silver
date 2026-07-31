import { consultByAudio } from "@/behavioral-checker/client-assistance/core/actions/ConsultByAudio";
import { InvalidModelResponseError } from "@/behavioral-checker/client-assistance/infrastructure/OpenAISdkAIClient";
import {
  addFeedbackToNotion,
  NotionOperationError,
} from "@/behavioral-checker/notion/database";
import { ApiLogger, createApiLogger } from "@/lib/structured-logger";
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
  logger: ApiLogger
) => {
  let status = 500;
  let outcome = "error";

  try {
    if (req.method !== "POST") {
      status = 405;
      outcome = "method_not_allowed";
      return res.status(405).json({ error: "Method not allowed" });
    }

    const file = (req as any).file;
    if (!file) {
      status = 400;
      outcome = "no_file";
      return res.status(400).json({ error: "No file uploaded" });
    }

    const filePath = path.join(os.tmpdir(), file.filename);
    const id = req.body.id as string;
    const question = req.body.question as string;
    logger.setContext({ questionId: id });

    const result = await consultByAudio.invoke(id, question, filePath, logger);

    let notionPersisted = true;
    try {
      await addFeedbackToNotion(result);
    } catch (error) {
      notionPersisted = false;
      logger.error(error);
      logger.setContext({
        "notion.operation": "addFeedbackToNotion",
        "notion.timed_out":
          error instanceof NotionOperationError && error.timedOut,
      });
    }

    if (notionPersisted) {
      status = 200;
      outcome = "success";
      res.status(200).json(result);
    } else {
      status = 202;
      outcome = "notion_write_failed";
      res.status(202).json({ ...result, notionPersisted: false });
    }
  } catch (error) {
    logger.error(error);
    if (error instanceof InvalidModelResponseError) {
      status = 502;
      outcome = "invalid_model_response";
      res.status(502).json({ error: "invalid_model_response" });
    } else {
      status = 500;
      outcome = "error";
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
    logger.setContext({ "http.response.status_code": status, outcome });
    logger.emit();
  }
};

const middleware = upload.single("audio");
const multerMiddleware = (req: any, res: any, logger: ApiLogger, next: any) =>
  middleware(req, res, (err) => {
    if (err) {
      logger.error(err);
      logger.setContext({
        "http.response.status_code": 500,
        outcome: "upload_error",
      });
      logger.emit();
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
  const logger = createApiLogger(
    "/api/analysis",
    req.method ?? "UNKNOWN",
    "analysis"
  );
  return multerMiddleware(req, res, logger, () => handler(req, res, logger));
};

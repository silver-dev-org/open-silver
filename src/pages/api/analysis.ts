import { consultByAudio } from "@/behavioral-checker/client-assistance/core/actions/ConsultByAudio";
import { addFeedbackToNotion } from "@/behavioral-checker/notion/database";
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

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const file = (req as any).file;
    if (!file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const filePath = path.join(os.tmpdir(), file.filename);
    const id = req.body.id as string;
    const question = req.body.question as string;

    const result = await consultByAudio.invoke(id, question, filePath);

    if (req.body.consent === "true") {
      addFeedbackToNotion(result);
    }

    res.status(200).json(result);
  } catch (error) {
    console.error("Error processing audio:", error);
    res.status(500).json({ error: "Error processing audio" });
  } finally {
    const tempFilePath = path.join(os.tmpdir(), (req as any).file.filename);
    try {
      await fs.unlink(tempFilePath);
    } catch (error) {
      console.error("Error deleting temporary file:", error);
    }
  }
};

const middleware = upload.single("audio");
const multerMiddleware = (req: any, res: any, next: any) =>
  middleware(req, res, (err) => {
    if (err) {
      console.error("Error uploading file:", err);
      return res.status(500).json({ error: "File upload error" });
    }
    next();
  });

export const config = {
  api: {
    bodyParser: false,
  },
};

export default (req: NextApiRequest, res: NextApiResponse) =>
  multerMiddleware(req, res, () => handler(req, res));

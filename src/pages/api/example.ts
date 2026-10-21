import { Result } from "@/behavioral-checker/client-assistance/core/domain/Action";
import { getLastFeedback } from "@/behavioral-checker/notion/database";
import { NextApiRequest, NextApiResponse } from "next";
import { createRouteLog } from "@/lib/route-log";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const log = createRouteLog("/api/example");
  if (req.method !== "POST") {
    log.info("method_not_allowed");
    return res.status(405).json({ error: "Método no permitido" });
  }

  try {
    const { id, result } = req.body;

    if (!id || !result) {
      log.info("bad_request");
      return res.status(400).json({ error: "Faltan parámetros requeridos" });
    }

    const feedback = await getLastFeedback(id, result as Result);

    if (!feedback) {
      log.info("not_found");
      return res.status(204).end();
    }

    log.info("found");
    return res.status(200).json(feedback);
  } catch (error) {
    log.unexpected(error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
}

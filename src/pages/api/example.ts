import { Result } from "@/behavioral-checker/client-assistance/core/domain/Action";
import { getLastFeedback } from "@/behavioral-checker/notion/database";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  try {
    const { id, result } = req.body;

    if (!id || !result) {
      return res.status(400).json({ error: "Faltan parámetros requeridos" });
    }

    const feedback = await getLastFeedback(id, result as Result);

    if (!feedback) {
      return res.status(204).end();
    }

    return res.status(200).json(feedback);
  } catch (error) {
    console.error("Error en /api/example:", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
}

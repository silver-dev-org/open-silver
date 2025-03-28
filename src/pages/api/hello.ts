// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import { getStrongYesFeedback } from "@/behavioral-checker/notion/database";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const results = await getStrongYesFeedback("interest-in-position");
  res.status(200).json({ results });
}

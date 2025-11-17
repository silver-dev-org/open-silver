import { NextApiRequest, NextApiResponse } from 'next';
import { createPrompt } from '@/company-checker/utils/prompts';
import { rateLimit } from '@/company-checker/utils/rate-limiter';
import { sanitizeCompanyName } from '@/company-checker/utils/sanitize';
import { google } from "@ai-sdk/google";
import { generateText } from "ai";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    // Apply rate limiting
    const rateLimitResult = rateLimit(req, res);
    if (!rateLimitResult.success) {
      res.status(429).setHeader('Retry-After', rateLimitResult.retryAfter?.toString() || '60');
      res.json({ error: rateLimitResult.message });
      return;
    }

    const { company } = req.query;

    // Validate company parameter
    if (!company || typeof company !== 'string') {
      res.status(400).json({ error: 'Company name is required' });
      return;
    }

    // Sanitize company name
    const sanitizedCompany = sanitizeCompanyName(company);

    // Create the prompt
    const prompt = createPrompt(sanitizedCompany);

    const { text } = await generateText({
      model: google("gemini-2.0-flash"),
      system: "You are a helpful assistant.",
      prompt: createPrompt(company),
    });

    if (!text) {
      throw new Error(
        "No se pudo completar el proceso de investigación de empresa.",
      );
    }

    res.status(200).json({ text });
  } catch (error) {
    console.error('Error procesando la solicitud:', error);
    const statusCode = error instanceof Error && error.message.includes('Company name') ? 400 : 500;
    res.status(statusCode).json({
      error: error instanceof Error ? error.message : 'Un error inesperado ocurrió mientras se procesaba la solicitud'
    });
  }
} 
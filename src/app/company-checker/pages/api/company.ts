import { NextApiRequest, NextApiResponse } from 'next';
import { createPrompt } from '@/company-checker/utils/prompts';
import { rateLimit } from '@/company-checker/utils/rate-limiter';
import { sanitizeCompanyName } from '@/company-checker/utils/sanitize';

// CORS configuration
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    res.writeHead(200, corsHeaders);
    res.end();
    return;
  }

  // Only allow GET requests
  if (req.method !== 'GET') {
    res.writeHead(405, corsHeaders);
    res.end(JSON.stringify({ error: 'Method not allowed' }));
    return;
  }

  try {
    // Apply rate limiting
    const rateLimitResult = rateLimit(req, res);
    if (!rateLimitResult.success) {
      res.writeHead(429, {
        ...corsHeaders,
        'Retry-After': rateLimitResult.retryAfter,
      });
      res.end(JSON.stringify({ error: rateLimitResult.message }));
      return;
    }

    const { company } = req.query;

    // Validate company parameter
    if (!company || typeof company !== 'string') {
      res.writeHead(400, corsHeaders);
      res.end(JSON.stringify({ error: 'Company name is required' }));
      return;
    }

    // Sanitize company name
    const sanitizedCompany = sanitizeCompanyName(company);

    // Create the prompt
    const prompt = createPrompt(sanitizedCompany);

    // Here you would typically make an API call to your AI service
    // For now, we'll return the prompt as a placeholder
    res.writeHead(200, corsHeaders);
    res.end(JSON.stringify({ text: prompt }));
  } catch (error) {
    console.error('Error processing company request:', error);
    const statusCode = error instanceof Error && error.message.includes('Company name') ? 400 : 500;
    res.writeHead(statusCode, corsHeaders);
    res.end(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'An unexpected error occurred while processing your request' 
    }));
  }
} 
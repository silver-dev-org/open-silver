import { NextApiRequest, NextApiResponse } from 'next';
import { createPrompt } from '@/company-checker/utils/prompts';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { company } = req.query;

    // Validate company parameter
    if (!company || typeof company !== 'string') {
      return res.status(400).json({ error: 'Company name is required' });
    }

    // Create the prompt
    const prompt = createPrompt(company);

    // Here you would typically make an API call to your AI service
    // For now, we'll return the prompt as a placeholder
    return res.status(200).json({ text: prompt });
  } catch (error) {
    console.error('Error processing company request:', error);
    return res.status(500).json({ 
      error: 'An unexpected error occurred while processing your request' 
    });
  }
} 
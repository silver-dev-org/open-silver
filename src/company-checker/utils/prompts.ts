export const createPrompt = (company: string) => `
  I'm preparing for a job interview with ${company}. I need a full, detailed research summary to be well-prepared.

  Please provide the following information organized by sections, and format the response in real raw Markdown (#, ##, -, etc.) so it's easy to read and structured.

  IMPORTANT FORMATTING RULES:
  1. Use proper Markdown formatting (# for main sections, ## for subsections, - for bullet points)
  
  Sections to include:

  Company Overview:
  - What does the company do in simple terms?
  - What is their main product or service?
  - How does the product or service work? (high-level and, if possible, some technical detail)

  Industry Context:
  - In which industry does the company operate?
  - Briefly describe current trends, challenges, and opportunities in this industry.

  Company History and Status:
  - When was the company founded?
  - Who are the founders and what is their background?
  - How big is the company today (number of employees, main offices)?

  Funding and Growth:
  - Has the company raised any funding?
  - What funding rounds have they completed (Seed, Series A, B, etc.)?
  - Who are their main investors?

  Business Model:
  - How does the company make money?
  - What is their go-to-market strategy (if available)?

  Competitive Landscape:
  - Who are the main competitors?
  - What is the company's competitive advantage?

  Recent News and Developments:
  - Major updates in the past 6–12 months (product launches, partnerships, expansions, controversies, etc.).

  Technical Architecture / Core Technology (optional if applicable):
  - If the main product involves APIs, AI, SaaS, or technical systems, explain briefly the high-level technical architecture or core technologies they use.

  If any information is not available publicly, just note it briefly.

  DISCLAIMER:
  This information is AI-generated and should be verified independently. Some details may be outdated or inaccurate.
`; 
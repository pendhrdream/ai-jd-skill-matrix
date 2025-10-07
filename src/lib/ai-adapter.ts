import OpenAI from 'openai';
import { SkillMatrix, validateSkillMatrix } from './schema';

export class AIAdapter {
  private openai: OpenAI | null = null;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY || process.env.OPENAI_KEY;
    if (apiKey) {
      this.openai = new OpenAI({ apiKey });
    }
  }

  async extractSkills(jobDescription: string): Promise<SkillMatrix> {
    if (!this.openai) {
      throw new Error('OpenAI API key not configured');
    }

    const systemPrompt = `You are an expert job description analyzer. Extract skills and requirements from job descriptions and return a structured JSON response.

Return ONLY valid JSON matching this exact schema:
{
  "title": "string",
  "seniority": "junior" | "mid" | "senior" | "lead" | "unknown",
  "skills": {
    "frontend": ["string"],
    "backend": ["string"],
    "devops": ["string"],
    "web3": ["string"],
    "other": ["string"]
  },
  "mustHave": ["string"],
  "niceToHave": ["string"],
  "salary": {
    "currency": "USD" | "EUR" | "PLN" | "GBP",
    "min": number,
    "max": number
  },
  "summary": "string (max 60 words)"
}

Guidelines:
- Categorize skills into frontend, backend, devops, web3, or other
- Extract web3/blockchain skills (solidity, wagmi, viem, merkle, staking, etc.) into web3 array
- Infer seniority from context (junior, mid, senior, lead, or unknown)
- Extract salary ranges with currency
- Generate a concise summary (≤60 words)
- Return ONLY the JSON, no other text`;

    const userPrompt = `Analyze this job description and extract the skill matrix:

${jobDescription}`;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.1,
        max_tokens: 2000
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from OpenAI');
      }

      // Try to parse the JSON response
      let jsonData;
      try {
        jsonData = JSON.parse(content);
      } catch {
        // If JSON parsing fails, try to extract JSON from the response
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          jsonData = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('Invalid JSON response from AI');
        }
      }

      // Validate the response against our schema
      return validateSkillMatrix(jsonData);

    } catch (error) {
      // If validation fails, try once more with a fix prompt
      if (error instanceof Error && error.message.includes('Validation failed')) {
        return await this.retryWithFixPrompt(jobDescription, error.message);
      }
      throw error;
    }
  }

  private async retryWithFixPrompt(jobDescription: string, validationError: string): Promise<SkillMatrix> {
    if (!this.openai) {
      throw new Error('OpenAI API key not configured');
    }

    const fixPrompt = `The previous response had validation errors: ${validationError}

Please fix the JSON to match the exact schema and return ONLY valid JSON:

{
  "title": "string",
  "seniority": "junior" | "mid" | "senior" | "lead" | "unknown",
  "skills": {
    "frontend": ["string"],
    "backend": ["string"],
    "devops": ["string"],
    "web3": ["string"],
    "other": ["string"]
  },
  "mustHave": ["string"],
  "niceToHave": ["string"],
  "salary": {
    "currency": "USD" | "EUR" | "PLN" | "GBP",
    "min": number,
    "max": number
  },
  "summary": "string (max 60 words)"
}

Job description:
${jobDescription}`;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'user', content: fixPrompt }
        ],
        temperature: 0.1,
        max_tokens: 2000
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from OpenAI on retry');
      }

      const jsonData = JSON.parse(content);
      return validateSkillMatrix(jsonData);

    } catch (error) {
      throw new Error(`AI extraction failed after retry: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  isAvailable(): boolean {
    return this.openai !== null;
  }
}

import { NextRequest } from 'next/server';
import { AIAdapter } from '@/lib/ai-adapter';
import { FallbackParser } from '@/lib/fallback-parser';
import { validateSkillMatrix } from '@/lib/schema';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { jobDescription } = body;

    if (!jobDescription || typeof jobDescription !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Job description is required and must be a string' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (jobDescription.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: 'Job description cannot be empty' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const aiAdapter = new AIAdapter();
    
    if (!aiAdapter.isAvailable()) {
      // Use fallback parser for non-streaming response
      const fallbackParser = new FallbackParser(jobDescription);
      const skillMatrix = fallbackParser.parse();
      const validatedMatrix = validateSkillMatrix(skillMatrix);

      return new Response(
        JSON.stringify({
          success: true,
          data: validatedMatrix,
          method: 'fallback'
        }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Create streaming response for AI
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        
        try {
          // Send initial status
          controller.enqueue(encoder.encode('data: {"type": "status", "message": "Starting AI analysis..."}\n\n'));

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

          // Send progress update
          controller.enqueue(encoder.encode('data: {"type": "status", "message": "Analyzing job description..."}\n\n'));

          const openai = new (await import('openai')).default({ 
            apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_KEY 
          });
          const response = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt }
            ],
            temperature: 0.1,
            max_tokens: 2000,
            stream: true
          });

          let fullResponse = '';
          
          for await (const chunk of response) {
            const content = chunk.choices[0]?.delta?.content;
            if (content) {
              fullResponse += content;
              // Send streaming content
              controller.enqueue(encoder.encode(`data: {"type": "content", "content": "${content.replace(/"/g, '\\"')}"}\n\n`));
            }
          }

          // Send completion status
          controller.enqueue(encoder.encode('data: {"type": "status", "message": "Processing response..."}\n\n'));

          // Parse and validate the response
          let jsonData;
          try {
            jsonData = JSON.parse(fullResponse);
          } catch {
            // Try to extract JSON from the response
            const jsonMatch = fullResponse.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              jsonData = JSON.parse(jsonMatch[0]);
            } else {
              throw new Error('Invalid JSON response from AI');
            }
          }

          const validatedMatrix = validateSkillMatrix(jsonData);

          // Send final result
          controller.enqueue(encoder.encode(`data: {"type": "result", "data": ${JSON.stringify(validatedMatrix)}, "method": "ai"}\n\n`));
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));

        } catch (error) {
          console.error('Streaming error:', error);
          
          // Fallback to deterministic parser
          try {
            controller.enqueue(encoder.encode('data: {"type": "status", "message": "AI failed, using fallback parser..."}\n\n'));
            
            const fallbackParser = new FallbackParser(jobDescription);
            const skillMatrix = fallbackParser.parse();
            const validatedMatrix = validateSkillMatrix(skillMatrix);

            controller.enqueue(encoder.encode(`data: {"type": "result", "data": ${JSON.stringify(validatedMatrix)}, "method": "fallback", "warning": "AI extraction failed, used fallback parser"}\n\n`));
            controller.enqueue(encoder.encode('data: [DONE]\n\n'));

          } catch {
            controller.enqueue(encoder.encode(`data: {"type": "error", "error": "Both AI and fallback extraction failed"}\n\n`));
            controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          }
        } finally {
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error('API route error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

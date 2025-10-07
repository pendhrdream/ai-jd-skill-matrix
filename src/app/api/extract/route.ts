import { NextRequest, NextResponse } from 'next/server';
import { AIAdapter } from '@/lib/ai-adapter';
import { FallbackParser } from '@/lib/fallback-parser';
import { validateSkillMatrix } from '@/lib/schema';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { jobDescription } = body;

    if (!jobDescription || typeof jobDescription !== 'string') {
      return NextResponse.json(
        { error: 'Job description is required and must be a string' },
        { status: 400 }
      );
    }

    if (jobDescription.trim().length === 0) {
      return NextResponse.json(
        { error: 'Job description cannot be empty' },
        { status: 400 }
      );
    }

    let skillMatrix;

    try {
      // Try AI extraction first if API key is available
      const aiAdapter = new AIAdapter();
      
      if (aiAdapter.isAvailable()) {
        console.log('Using AI extraction');
        skillMatrix = await aiAdapter.extractSkills(jobDescription);
      } else {
        console.log('Using fallback parser');
        const fallbackParser = new FallbackParser(jobDescription);
        skillMatrix = fallbackParser.parse();
      }

      // Validate the final result
      const validatedMatrix = validateSkillMatrix(skillMatrix);

      return NextResponse.json({
        success: true,
        data: validatedMatrix,
        method: aiAdapter.isAvailable() ? 'ai' : 'fallback'
      });

    } catch (aiError) {
      console.warn('AI extraction failed, falling back to deterministic parser:', aiError);
      
      // Fallback to deterministic parser if AI fails
      try {
        const fallbackParser = new FallbackParser(jobDescription);
        skillMatrix = fallbackParser.parse();
        
        const validatedMatrix = validateSkillMatrix(skillMatrix);

        return NextResponse.json({
          success: true,
          data: validatedMatrix,
          method: 'fallback',
          warning: 'AI extraction failed, used fallback parser'
        });

      } catch (fallbackError) {
        console.error('Both AI and fallback extraction failed:', fallbackError);
        return NextResponse.json(
          { 
            error: 'Failed to extract skills from job description',
            details: fallbackError instanceof Error ? fallbackError.message : 'Unknown error'
          },
          { status: 500 }
        );
      }
    }

  } catch (error) {
    console.error('API route error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Skill extraction API',
    methods: ['POST'],
    description: 'Send a POST request with { "jobDescription": "string" } to extract skills'
  });
}

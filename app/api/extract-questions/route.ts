/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
import { generateStructuredJson, base64ToGenerativePart, QuestionPaperSchemaGemini } from '@/lib/ai/gemini';
import { QUESTION_EXTRACTION_PROMPT } from '@/lib/ai/prompts';

export const maxDuration = 60; // Allow serverless function to run up to 60 seconds (Vercel hobby plan max is 10s-60s)

export async function POST(request: Request) {
  try {
    const { pageImage, pageNumber } = await request.json();

    if (!pageImage) {
      return NextResponse.json(
        { error: 'Page image data (base64) is required.' },
        { status: 400 }
      );
    }

    if (!process.env.GEMINI_API_KEY && !process.env.GEMINI_API_KEY_FALLBACK) {
      return NextResponse.json(
        { error: 'GEMINI_API_KEY is not configured on the server. Please set it or use Demo Mode.' },
        { status: 400 }
      );
    }

    const imagePart = base64ToGenerativePart(pageImage);
    const prompt = `${QUESTION_EXTRACTION_PROMPT}\n\nAnalyzing page number: ${pageNumber}`;

    const jsonText = await generateStructuredJson(
      prompt,
      [imagePart],
      QuestionPaperSchemaGemini,
      'gemini-3.6-flash'
    );

    const result = JSON.parse(jsonText);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error in question extraction:', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred during question extraction.' },
      { status: 500 }
    );
  }
}

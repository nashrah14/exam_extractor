/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
import { generateStructuredJson, base64ToGenerativePart, AnswerSheetSchemaGemini } from '@/lib/ai/gemini';
import { ANSWER_EXTRACTION_PROMPT } from '@/lib/ai/prompts';

export const maxDuration = 60;

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
    const prompt = `${ANSWER_EXTRACTION_PROMPT}\n\nAnalyzing answer sheet page number: ${pageNumber}`;

    const jsonText = await generateStructuredJson(
      prompt,
      [imagePart],
      AnswerSheetSchemaGemini,
      'gemini-3.6-flash'
    );

    const result = JSON.parse(jsonText);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error in answer extraction:', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred during answer extraction.' },
      { status: 500 }
    );
  }
}

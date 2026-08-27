/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
import { generateStructuredJson, AnswerMappingSchemaGemini } from '@/lib/ai/gemini';
import { ANSWER_MAPPING_PROMPT } from '@/lib/ai/prompts';

export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const { questions, answers } = await request.json();

    if (!questions || !answers) {
      return NextResponse.json(
        { error: 'Both questions and answers arrays are required.' },
        { status: 400 }
      );
    }

    if (!process.env.GEMINI_API_KEY && !process.env.GEMINI_API_KEY_FALLBACK) {
      return NextResponse.json(
        { error: 'GEMINI_API_KEY is not configured on the server. Please set it or use Demo Mode.' },
        { status: 400 }
      );
    }

    const payload = {
      questions: questions.map((q: any) => ({
        id: q.id,
        number: q.number,
        text: q.text,
      })),
      answers: answers.map((a: any) => ({
        id: a.id,
        rawQuestionReference: a.rawQuestionReference,
        normalizedQuestionReference: a.normalizedQuestionReference,
        text: a.text,
      })),
    };

    const prompt = `${ANSWER_MAPPING_PROMPT}\n\nInput Data:\n${JSON.stringify(payload, null, 2)}`;

    const jsonText = await generateStructuredJson(
      prompt,
      [], // No images needed for text-to-text mapping
      AnswerMappingSchemaGemini,
      'gemini-3.6-flash'
    );

    const result = JSON.parse(jsonText);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error in answer mapping:', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred during answer mapping.' },
      { status: 500 }
    );
  }
}

/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
import { generateStructuredJson, GradingSchemaGemini, base64ToGenerativePart } from '@/lib/ai/gemini';
import { GRADING_PROMPT } from '@/lib/ai/prompts';

export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const { 
      questionNumber, 
      questionText, 
      maxScore, 
      studentAnswerText,
      studentAnswerVisualElements,
      studentAnswerPageImages
    } = await request.json();

    if (!questionNumber || !questionText || !studentAnswerText) {
      return NextResponse.json(
        { error: 'questionNumber, questionText, and studentAnswerText are required.' },
        { status: 400 }
      );
    }

    if (!process.env.GEMINI_API_KEY && !process.env.GEMINI_API_KEY_FALLBACK) {
      return NextResponse.json(
        { error: 'GEMINI_API_KEY is not configured on the server. Please set it or use Demo Mode.' },
        { status: 400 }
      );
    }

    const defaultMaxScore = maxScore || 5;

    // Convert page images to GenAI image parts
    const imageParts = studentAnswerPageImages && Array.isArray(studentAnswerPageImages)
      ? studentAnswerPageImages.map((img: string) => base64ToGenerativePart(img))
      : [];

    const prompt = `${GRADING_PROMPT}
    
Question Number: ${questionNumber}
Question Text: ${questionText}
Maximum Marks: ${defaultMaxScore}
Student's Handwritten Answer Transcript: "${studentAnswerText}"
Student's Handwritten Answer Visual Elements Description: ${JSON.stringify(studentAnswerVisualElements || [], null, 2)}
`;

    const jsonText = await generateStructuredJson(
      prompt,
      imageParts, // Pass the actual page images where the answer is written!
      GradingSchemaGemini,
      'gemini-3.6-flash'
    );

    const result = JSON.parse(jsonText);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error in answer grading:', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred during grading.' },
      { status: 500 }
    );
  }
}

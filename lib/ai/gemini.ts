/* eslint-disable @typescript-eslint/no-explicit-any */
import { GoogleGenAI } from '@google/genai';

// Helper to get all configured API keys (including comma-separated lists and fallbacks)
function getApiKeys(): string[] {
  const keys: string[] = [];
  
  if (process.env.GEMINI_API_KEY) {
    const splitKeys = process.env.GEMINI_API_KEY.split(',').map((k) => k.trim()).filter(Boolean);
    keys.push(...splitKeys);
  }
  
  if (process.env.GEMINI_API_KEY_FALLBACK) {
    const splitKeys = process.env.GEMINI_API_KEY_FALLBACK.split(',').map((k) => k.trim()).filter(Boolean);
    keys.push(...splitKeys);
  }

  if (process.env.GEMINI_API_KEY_FALLBACK_2) {
    const splitKeys = process.env.GEMINI_API_KEY_FALLBACK_2.split(',').map((k) => k.trim()).filter(Boolean);
    keys.push(...splitKeys);
  }

  if (process.env.GEMINI_API_KEY_FALLBACK_3) {
    const splitKeys = process.env.GEMINI_API_KEY_FALLBACK_3.split(',').map((k) => k.trim()).filter(Boolean);
    keys.push(...splitKeys);
  }

  return Array.from(new Set(keys));
}

export function hasApiKeys(): boolean {
  return getApiKeys().length > 0;
}

// Helper to convert base64 data URL to Gemini GenAI part
export function base64ToGenerativePart(base64DataUrl: string) {
  const matches = base64DataUrl.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
  if (!matches) {
    throw new Error('Invalid image format: must be a valid base64 data URL');
  }
  return {
    inlineData: {
      data: matches[2],
      mimeType: matches[1],
    },
  };
}

// Bounding Box Schema Definition in standard JSON Schema format
const BoundingBoxSchemaGemini = {
  type: 'object',
  properties: {
    x: { type: 'integer', description: 'Normalized x coordinate (0 to 1000)' },
    y: { type: 'integer', description: 'Normalized y coordinate (0 to 1000)' },
    width: { type: 'integer', description: 'Normalized width (0 to 1000)' },
    height: { type: 'integer', description: 'Normalized height (0 to 1000)' },
  },
  required: ['x', 'y', 'width', 'height'],
};

// Answer Region Schema definition
const AnswerRegionSchemaGemini = {
  type: 'object',
  properties: {
    bbox: BoundingBoxSchemaGemini,
    type: { 
      type: 'string', 
      description: 'The type of this region: text, diagram, equation, table, graph, drawing, mixed, or other' 
    },
    confidence: { type: 'number', description: 'Detection confidence (0.0 to 1.0)' },
  },
  required: ['bbox', 'type', 'confidence'],
};

// Visual Element Schema definition
const VisualElementSchemaGemini = {
  type: 'object',
  properties: {
    type: {
      type: 'string',
      description: 'The visual type: diagram, drawing, equation, graph, table, flowchart, symbol, annotation, or other'
    },
    description: { type: 'string', description: 'Text description of this visual element and what it depicts (e.g., plant drawing with roots, chemical formulas)' },
    bbox: BoundingBoxSchemaGemini,
    labels: {
      type: 'array',
      items: { type: 'string' },
      description: 'Handwritten annotations or labels visible on or around this element'
    },
    confidence: { type: 'number' }
  },
  required: ['type', 'description', 'bbox', 'confidence']
};

// Question Paper Schema
export const QuestionPaperSchemaGemini = {
  type: 'object',
  properties: {
    questions: {
      type: 'array',
      description: 'List of all questions extracted from the question paper page in order.',
      items: {
        type: 'object',
        properties: {
          number: { type: 'string', description: 'Printed number, e.g. "1", "3(a)", "3(b)"' },
          text: { type: 'string', description: 'The exact question wording text' },
          parentNumber: { type: 'string', nullable: true, description: 'Parent question number (e.g. "3") if this is a sub-part, otherwise null' },
          subPart: { type: 'string', nullable: true, description: 'Subpart label (e.g. "a") if this is a sub-part, otherwise null' },
          confidence: { type: 'number', description: 'Confidence of the extraction (0.0 to 1.0)' },
          bbox: {
            ...BoundingBoxSchemaGemini,
            nullable: true,
            description: 'The bounding box around the printed question text on the page, or null if not detectable',
          },
        },
        required: ['number', 'text', 'confidence'],
      },
    },
  },
  required: ['questions'],
};

// Answer Sheet Schema
export const AnswerSheetSchemaGemini = {
  type: 'object',
  properties: {
    answers: {
      type: 'array',
      description: 'List of all handwritten answers detected on this answer sheet page.',
      items: {
        type: 'object',
        properties: {
          rawQuestionReference: { type: 'string', description: 'The student label for this answer (e.g. "Q1", "3(a)", "No Label")' },
          text: { type: 'string', description: 'Transcription of the handwritten answer text' },
          confidence: { type: 'number', description: 'Confidence of the transcription (0.0 to 1.0)' },
          regions: {
            type: 'array',
            items: AnswerRegionSchemaGemini,
            description: 'The bounding box areas of this answer on the page (can be separate text, equations, or diagram areas)'
          },
          visualElements: {
            type: 'array',
            items: VisualElementSchemaGemini,
            description: 'List of diagrams, equations, tables, graphs, drawings, or sketches within this answer'
          },
          hasDiagram: { type: 'boolean', description: 'True if a diagram or drawing is present' },
          hasEquation: { type: 'boolean', description: 'True if a formula or equation is present' },
          hasTable: { type: 'boolean', description: 'True if a table is present' },
          hasGraph: { type: 'boolean', description: 'True if a graph is present' },
          hasDrawing: { type: 'boolean', description: 'True if a drawing is present' }
        },
        required: [
          'rawQuestionReference', 
          'text', 
          'confidence', 
          'regions', 
          'visualElements', 
          'hasDiagram', 
          'hasEquation', 
          'hasTable', 
          'hasGraph', 
          'hasDrawing'
        ],
      },
    },
  },
  required: ['answers'],
};

// Answer Mapping Schema
export const AnswerMappingSchemaGemini = {
  type: 'object',
  properties: {
    mappings: {
      type: 'array',
      description: 'Mappings linking each question paper question to an extracted student answer.',
      items: {
        type: 'object',
        properties: {
          questionId: { type: 'string', description: 'ID of the question in the question paper list' },
          answerId: { type: 'string', nullable: true, description: 'ID of the mapped answer, or null if unanswered' },
          status: { 
            type: 'string', 
            description: 'Status of the mapping: matched, unanswered, unmatched, or ambiguous' 
          },
          confidence: { type: 'number', description: 'Mapping confidence (0.0 to 1.0)' },
          reason: { type: 'string', description: 'Justification for this mapping choice' },
        },
        required: ['questionId', 'status', 'confidence', 'reason'],
      },
    },
  },
  required: ['mappings'],
};

// Grading Schema
export const GradingSchemaGemini = {
  type: 'object',
  properties: {
    score: { type: 'integer', description: 'Score awarded to the student (0 to maxMarks)' },
    maxScore: { type: 'integer', description: 'Maximum score possible for the question' },
    evaluation: { type: 'string', description: 'One-word verdict: Correct, Partially Correct, or Incorrect' },
    feedback: { type: 'string', description: 'Constructive feedback explaining the grade and what to improve' },
    strengths: { type: 'string', description: 'Strengths shown by the student in this answer' },
    missingConcepts: { type: 'string', description: 'Key concepts or parts of the answer that were incorrect or missing' },
  },
  required: ['score', 'maxScore', 'evaluation', 'feedback', 'strengths', 'missingConcepts'],
};

// Core helper function to run model calls with structured schemas and automatic fallback key rotation
export async function generateStructuredJson(
  prompt: string,
  imageParts: any[],
  schema: any,
  modelName: string = 'gemini-3.6-flash'
): Promise<string> {
  const apiKeys = getApiKeys();
  if (apiKeys.length === 0) {
    throw new Error('GEMINI_API_KEY is not defined in the environment variables.');
  }

  // Temporary runtime safe diagnostic logging (Step 10)
  console.log(`[VedaAI API Logger] AI provider: Gemini`);
  console.log(`[VedaAI API Logger] AI model: ${modelName}`);
  console.log(`[VedaAI API Logger] Configured API keys count: ${apiKeys.length}`);

  const contents = [...imageParts, prompt];
  let lastError: any = null;

  for (let i = 0; i < apiKeys.length; i++) {
    const key = apiKeys[i];
    const maskedKey = key.length > 8 ? `${key.substring(0, 4)}...${key.substring(key.length - 4)}` : '***';
    console.log(`[VedaAI API Logger] Attempting call with API Key #${i + 1} (${maskedKey})`);

    try {
      const client = new GoogleGenAI({ apiKey: key });
      const response = await client.models.generateContent({
        model: modelName,
        contents: contents,
        config: {
          responseMimeType: 'application/json',
          responseSchema: schema,
          temperature: 0.1, // Low temperature for OCR/mapping/critique tasks
        }
      });

      if (!response.text) {
        throw new Error('Empty response from Gemini API.');
      }

      console.log(`[VedaAI API Logger] Succeeded using API Key #${i + 1}`);
      return response.text;
    } catch (error: any) {
      console.warn(`[VedaAI API Logger] API Key #${i + 1} failed:`, error.message || error);
      lastError = error;
      if (i < apiKeys.length - 1) {
        console.warn(`[VedaAI API Logger] Rotating to next fallback API key...`);
      }
    }
  }

  throw new Error(
    `All configured Gemini API keys failed. Last error: ${lastError?.message || lastError}`
  );
}

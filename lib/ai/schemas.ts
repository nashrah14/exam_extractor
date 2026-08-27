import { z } from 'zod';

export const BoundingBoxSchema = z.object({
  x: z.number().min(0).max(1000).describe('Normalized X position (0 to 1000)'),
  y: z.number().min(0).max(1000).describe('Normalized Y position (0 to 1000)'),
  width: z.number().min(0).max(1000).describe('Normalized width (0 to 1000)'),
  height: z.number().min(0).max(1000).describe('Normalized height (0 to 1000)'),
});

// Single Page Question Extraction Schema
export const ExtractedQuestionItemSchema = z.object({
  number: z.string().describe('The printed question numbering, e.g. "1", "3(a)", "3(b)", "4".'),
  text: z.string().describe('The extracted full text of the question, omitting headers/footers.'),
  parentNumber: z.string().nullable().describe('The parent question number if this is a subpart (e.g. "3" for "3(a)"). Otherwise null.'),
  subPart: z.string().nullable().describe('The subpart label if applicable (e.g. "a" for "3(a)"). Otherwise null.'),
  confidence: z.number().min(0).max(1).describe('Extraction confidence from 0.0 to 1.0.'),
  bbox: BoundingBoxSchema.nullable().describe('Normalized bounding box region containing the question on this page.'),
});

export const QuestionPaperPageExtractionSchema = z.object({
  questions: z.array(ExtractedQuestionItemSchema),
});

// Expanded Visual Element Schema for answer sheets
export const VisualElementSchema = z.object({
  type: z.enum(['diagram', 'drawing', 'equation', 'graph', 'table', 'flowchart', 'symbol', 'annotation', 'other']),
  description: z.string().describe('Detailed description of the visual element (e.g., balanced chemical equation, plant diagram with water/sunlight labels)'),
  bbox: BoundingBoxSchema.describe('Normalized coordinates of the visual element on the page'),
  labels: z.array(z.string()).optional().describe('Text labels/annotations attached to or written inside this visual element'),
  confidence: z.number().min(0).max(1),
});

export const AnswerRegionSchema = z.object({
  bbox: BoundingBoxSchema.describe('Bounding box of this component block'),
  type: z.enum(['text', 'diagram', 'equation', 'table', 'graph', 'drawing', 'mixed', 'other']),
  confidence: z.number().min(0).max(1),
});

// Single Page Answer Extraction Schema with Multimodal Vision indicators
export const ExtractedAnswerItemSchema = z.object({
  rawQuestionReference: z.string().describe('The question label written by the student, e.g., "Q1", "Ans 2", "3a", "No Label".'),
  text: z.string().describe('The transcribed handwritten answers, capturing written text and math/chemical equations as text too.'),
  confidence: z.number().min(0).max(1).describe('Confidence of text transcription.'),
  regions: z.array(AnswerRegionSchema).describe('The specific bounding regions of this answer on this page (can be separate text, equations, and diagrams).'),
  visualElements: z.array(VisualElementSchema).describe('List of non-text visual features (diagrams, tables, graphs, drawings, chemical equations) found within this answer.'),
  hasDiagram: z.boolean().describe('True if a diagram or drawing is present in this answer.'),
  hasEquation: z.boolean().describe('True if mathematical formulas or chemical equations are present.'),
  hasTable: z.boolean().describe('True if a structured table is present.'),
  hasGraph: z.boolean().describe('True if a graph or chart is present.'),
  hasDrawing: z.boolean().describe('True if illustrations or sketch drawings are present.'),
});

export const AnswerSheetPageExtractionSchema = z.object({
  answers: z.array(ExtractedAnswerItemSchema),
});

// Mapping Stage Schema
export const MappingItemSchema = z.object({
  questionId: z.string(),
  answerId: z.string().nullable(),
  status: z.enum(['matched', 'unanswered', 'unmatched', 'ambiguous']),
  confidence: z.number().min(0).max(1),
  reason: z.string().describe('Detailed explanation of why this mapping was made.'),
});

export const AnswerMappingSchema = z.object({
  mappings: z.array(MappingItemSchema),
});

// Grading Schema
export const GradingSchema = z.object({
  score: z.number(),
  maxScore: z.number(),
  evaluation: z.string().describe('E.g. "Correct", "Partially Correct", "Incorrect".'),
  feedback: z.string().describe('Feedback to the student, referencing visual elements like diagrams and equations if present.'),
  strengths: z.string().describe('What the student did well, referencing text, formulas, or diagrams.'),
  missingConcepts: z.string().describe('What was incorrect or omitted (verify visually from the original drawing description before claiming omission!).'),
});

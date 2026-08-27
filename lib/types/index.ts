export interface BoundingBox {
  x: number;      // 0-1000 normalized x coordinate
  y: number;      // 0-1000 normalized y coordinate
  width: number;  // 0-1000 normalized width
  height: number; // 0-1000 normalized height
}

export interface Question {
  id: string;
  number: string; // Exact printed number (e.g. "1", "3(a)")
  text: string;
  parentNumber: string | null;
  subPart: string | null;
  confidence: number;
  page: number;
  bbox: BoundingBox | null;
}

export type RegionType =
  | 'text'
  | 'diagram'
  | 'equation'
  | 'table'
  | 'graph'
  | 'drawing'
  | 'mixed'
  | 'other';

export interface AnswerRegion {
  page: number;
  bbox: BoundingBox;
  type: RegionType;
  confidence: number;
}

export interface VisualElement {
  id: string;
  type: 'diagram' | 'drawing' | 'equation' | 'graph' | 'table' | 'flowchart' | 'symbol' | 'annotation' | 'other';
  description: string;
  page: number;
  bbox: BoundingBox;
  labels?: string[];
  confidence: number;
}

export interface Answer {
  id: string;
  rawQuestionReference: string; // What student wrote (e.g. "Q1", "3a")
  normalizedQuestionReference: string; // Cleaned reference (e.g. "1", "3(a)")
  text: string;
  regions: AnswerRegion[]; // Multiple highlighted boxes on the sheet
  visualElements: VisualElement[];
  hasDiagram: boolean;
  hasEquation: boolean;
  hasTable: boolean;
  hasGraph: boolean;
  hasDrawing: boolean;
  confidence: number; // overall extraction confidence
}

export interface AnswerMapping {
  questionId: string;
  answerId: string | null; // Null if unanswered
  status: 'matched' | 'unanswered' | 'unmatched' | 'ambiguous';
  confidence: number;
  reason: string;
}

export interface GradingResult {
  score: number;
  maxScore: number;
  evaluation: string;
  feedback: string;
  strengths: string;
  missingConcepts: string;
}

export type ProcessingStage =
  | 'idle'
  | 'rendering_pdf'
  | 'extracting_questions'
  | 'extracting_answers'
  | 'mapping_answers'
  | 'grading'
  | 'completed'
  | 'error';

export interface ProcessingStatus {
  stage: ProcessingStage;
  progress: number; // 0 to 100
  message: string;
  error?: string | null;
}

export interface AssessmentResult {
  assessmentId: string;
  questions: Question[];
  answers: Answer[];
  mappings: AnswerMapping[];
  gradings: Record<string, GradingResult>; // Key is questionId
  unmatchedAnswers: Answer[]; // Answers that didn't map to any question
  gradingStatus?: 'not_started' | 'processing' | 'completed' | 'failed';
}

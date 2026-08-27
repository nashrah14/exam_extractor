import { Question, Answer, AnswerMapping, GradingResult, AssessmentResult } from './types';

// Mock Questions from a Printed Question Paper
export const mockQuestions: Question[] = [
  {
    id: 'q1',
    number: '1',
    text: 'Describe the process of photosynthesis and write its balanced chemical equation.',
    parentNumber: null,
    subPart: null,
    confidence: 0.98,
    page: 1,
    bbox: { x: 50, y: 100, width: 900, height: 120 },
  },
  {
    id: 'q2',
    number: '2',
    text: "What is the value of acceleration due to gravity on Earth's surface? State its SI unit.",
    parentNumber: null,
    subPart: null,
    confidence: 0.97,
    page: 1,
    bbox: { x: 50, y: 240, width: 900, height: 80 },
  },
  {
    id: 'q3a',
    number: '3(a)',
    text: 'Define kinetic energy and write its standard formula.',
    parentNumber: '3',
    subPart: 'a',
    confidence: 0.95,
    page: 1,
    bbox: { x: 50, y: 350, width: 900, height: 80 },
  },
  {
    id: 'q3b',
    number: '3(b)',
    text: 'A car of mass 1200 kg is travelling at 15 m/s. Calculate its kinetic energy.',
    parentNumber: '3',
    subPart: 'b',
    confidence: 0.94,
    page: 1,
    bbox: { x: 50, y: 450, width: 900, height: 100 },
  },
  {
    id: 'q4',
    number: '4',
    text: 'Explain the fundamental difference between nuclear fission and nuclear fusion.',
    parentNumber: null,
    subPart: null,
    confidence: 0.99,
    page: 2,
    bbox: { x: 50, y: 80, width: 900, height: 120 },
  },
];

// Mock Answers extracted from student sheets
export const mockAnswers: Answer[] = [
  {
    id: 'ans_001',
    rawQuestionReference: 'Q1',
    normalizedQuestionReference: '1',
    text: 'Photosynthesis is the process used by plants to convert light energy from the sun into chemical energy. It happens in the chloroplasts using chlorophyll. Carbon dioxide and water are turned into glucose and oxygen. Balanced Equation: 6 CO₂ + 6 H₂O + light ──> C₆H₁₂O₆ + 6 O₂.',
    confidence: 0.92,
    regions: [
      {
        page: 1,
        bbox: { x: 100, y: 150, width: 800, height: 320 },
        type: 'mixed',
        confidence: 0.95,
      },
      {
        page: 3,
        bbox: { x: 100, y: 120, width: 800, height: 280 },
        type: 'mixed',
        confidence: 0.93,
      },
    ],
    visualElements: [
      {
        id: 'vel_demo_001',
        type: 'diagram',
        description: 'Hand-drawn plant showing sunlight, carbon dioxide, water, and oxygen inputs/outputs.',
        page: 1,
        bbox: { x: 120, y: 180, width: 680, height: 240 },
        labels: ['Sunlight', 'Carbon dioxide', 'Oxygen', 'Water'],
        confidence: 0.96,
      },
      {
        id: 'vel_demo_002',
        type: 'equation',
        description: 'Balanced chemical equation for photosynthesis: 6 CO₂ + 6 H₂O + light ──> C₆H₁₂O₆ + 6 O₂.',
        page: 3,
        bbox: { x: 180, y: 260, width: 640, height: 100 },
        labels: ['CO₂', 'H₂O', 'Glucose', 'O₂', 'light'],
        confidence: 0.98,
      }
    ],
    hasDiagram: true,
    hasEquation: true,
    hasTable: false,
    hasGraph: false,
    hasDrawing: true,
  },
  {
    id: 'ans_002',
    rawQuestionReference: '4. Nuclear Fission & Fusion',
    normalizedQuestionReference: '4',
    text: 'Nuclear fission is when a heavy nucleus (like Uranium-235) splits into lighter nuclei when bombarded with a neutron, releasing a lot of energy. Nuclear fusion is the opposite - light nuclei (like Hydrogen isotopes) fuse together under extreme heat and pressure to make a heavier nucleus (Helium), releasing even more energy, like in the Sun.',
    confidence: 0.94,
    regions: [
      {
        page: 2,
        bbox: { x: 100, y: 100, width: 800, height: 420 },
        type: 'text',
        confidence: 0.94,
      },
    ],
    visualElements: [],
    hasDiagram: false,
    hasEquation: false,
    hasTable: false,
    hasGraph: false,
    hasDrawing: false,
  },
  {
    id: 'ans_003',
    rawQuestionReference: '3(a)',
    normalizedQuestionReference: '3(a)',
    text: 'Kinetic energy is the energy possessed by an object due to its motion. Any moving object has kinetic energy. Formula is K.E. = 1/2 m v^2.',
    confidence: 0.91,
    regions: [
      {
        page: 2,
        bbox: { x: 100, y: 580, width: 800, height: 220 },
        type: 'mixed',
        confidence: 0.91,
      },
    ],
    visualElements: [
      {
        id: 'vel_demo_003',
        type: 'equation',
        description: 'Kinetic energy standard formula: K.E. = 1/2 * m * v^2',
        page: 2,
        bbox: { x: 250, y: 740, width: 400, height: 60 },
        labels: ['m', 'v', 'K.E.'],
        confidence: 0.95,
      }
    ],
    hasDiagram: false,
    hasEquation: true,
    hasTable: false,
    hasGraph: false,
    hasDrawing: false,
  },
  {
    id: 'ans_unmatched',
    rawQuestionReference: 'Q5 (Extra)',
    normalizedQuestionReference: '5',
    text: 'Mitochondria is the powerhouse of the cell because it generates most of the ATP which acts as chemical energy for cell tasks.',
    confidence: 0.95,
    regions: [
      {
        page: 4,
        bbox: { x: 100, y: 200, width: 800, height: 240 },
        type: 'text',
        confidence: 0.95,
      },
    ],
    visualElements: [],
    hasDiagram: false,
    hasEquation: false,
    hasTable: false,
    hasGraph: false,
    hasDrawing: false,
  },
];


// Mock Mapping Results (Question ID -> Answer ID)
export const mockMappings: AnswerMapping[] = [
  {
    questionId: 'q1',
    answerId: 'ans_001',
    status: 'matched',
    confidence: 0.95,
    reason: 'Matched via handwritten label "Q1" and semantic description of plant glucose synthesis. Answer spans Page 1 and Page 3.',
  },
  {
    questionId: 'q2',
    answerId: null,
    status: 'unanswered',
    confidence: 1.0,
    reason: 'No student answer block corresponds to gravity constants or Question 2.',
  },
  {
    questionId: 'q3a',
    answerId: 'ans_003',
    status: 'matched',
    confidence: 0.98,
    reason: 'Matched via explicit handwritten label "3(a)" defining K.E. and its formula.',
  },
  {
    questionId: 'q3b',
    answerId: null,
    status: 'unanswered',
    confidence: 1.0,
    reason: 'Student defined kinetic energy in 3(a) but skipped the calculation part for 3(b).',
  },
  {
    questionId: 'q4',
    answerId: 'ans_002',
    status: 'matched',
    confidence: 0.96,
    reason: 'Matched via handwritten label "4" describing fission/fusion reactions.',
  },
];

// Mock Grading Results
export const mockGradings: Record<string, GradingResult> = {
  q1: {
    score: 4,
    maxScore: 5,
    evaluation: 'Partially Correct',
    feedback: 'Excellent explanation of the biological process. However, the student wrote the balanced chemical equation with minor balancing errors (forgot to detail light/chlorophyll over the reaction arrow, but chemical coefficients are correct).',
    strengths: 'Clear explanation of chloroplast function and the reactants/products involved.',
    missingConcepts: 'Should specify that light energy and chlorophyll act as catalysts for the conversion process.',
  },
  q3a: {
    score: 2,
    maxScore: 2,
    evaluation: 'Correct',
    feedback: 'Perfect definition of kinetic energy and correct mathematical formula.',
    strengths: 'Accurately detailed all components of the formula (m = mass, v = velocity).',
    missingConcepts: 'None.',
  },
  q4: {
    score: 5,
    maxScore: 5,
    evaluation: 'Correct',
    feedback: 'Splendid response. The student clearly contrasts fission (splitting heavy atoms) vs fusion (joining light atoms) and references stellar nucleosynthesis and Uranium fission as perfect examples.',
    strengths: 'Exceptional details on isotopes (Uranium-235, Hydrogen) and energy output ratios.',
    missingConcepts: 'None.',
  },
};

// Full Demo Result Package
export const demoAssessmentResult: AssessmentResult = {
  assessmentId: 'assessment_demo_101',
  questions: mockQuestions,
  answers: mockAnswers.filter(a => a.id !== 'ans_unmatched'),
  mappings: mockMappings,
  gradings: mockGradings,
  unmatchedAnswers: mockAnswers.filter(a => a.id === 'ans_unmatched'),
  gradingStatus: 'completed',
};

// Simulated Notebook Page Drawing Constants (to render on canvas)
export interface MockPageTextLine {
  text: string;
  x: number;
  y: number;
  isLabel?: boolean;
  isMath?: boolean;
}

export interface MockPageData {
  pageNumber: number;
  lines: MockPageTextLine[];
}

export const mockAnswerSheetPages: MockPageData[] = [
  {
    pageNumber: 1,
    lines: [
      { text: 'Q1.', x: 120, y: 180, isLabel: true },
      { text: 'Photosynthesis is the process used by plants to convert', x: 180, y: 180 },
      { text: 'light energy from the sun into chemical energy.', x: 120, y: 220 },
      { text: 'It happens in chloroplasts using chlorophyll pigment.', x: 120, y: 260 },
      { text: 'Carbon dioxide (CO2) from the air and water (H2O)', x: 120, y: 300 },
      { text: 'from the roots are turned into glucose (sugar) and', x: 120, y: 340 },
      { text: 'oxygen (O2) is released as a byproduct.', x: 120, y: 380 },
      { text: '(Continues on Page 3...)', x: 120, y: 430, isLabel: true },
    ],
  },
  {
    pageNumber: 2,
    lines: [
      { text: '4. Nuclear Fission & Fusion', x: 120, y: 130, isLabel: true },
      { text: 'Nuclear fission is when a heavy nucleus (like Uranium-235)', x: 120, y: 170 },
      { text: 'splits into lighter nuclei when hit by a slow neutron,', x: 120, y: 210 },
      { text: 'releasing a huge amount of energy and extra neutrons.', x: 120, y: 250 },
      { text: 'Nuclear fusion is the opposite: light nuclei (like Hydrogen', x: 120, y: 300 },
      { text: 'isotopes deuterium & tritium) fuse under immense pressure', x: 120, y: 340 },
      { text: 'and temperature to make a heavier helium nucleus. Fusion', x: 120, y: 380 },
      { text: 'releases even more energy than fission. It is what', x: 120, y: 420 },
      { text: 'powers the Sun and other stars.', x: 120, y: 460 },
      
      { text: '3(a)', x: 120, y: 610, isLabel: true },
      { text: 'Kinetic energy is the energy possessed by an object due', x: 180, y: 610 },
      { text: 'to its motion. Every moving body has kinetic energy.', x: 120, y: 650 },
      { text: 'Formula is:', x: 120, y: 690 },
      { text: 'K.E. = 1/2 * m * v^2', x: 250, y: 740, isMath: true },
    ],
  },
  {
    pageNumber: 3,
    lines: [
      { text: 'Photosynthesis - page 2', x: 120, y: 150, isLabel: true },
      { text: 'The balanced chemical equation for photosynthesis is:', x: 120, y: 190 },
      { text: '6 CO₂ + 6 H₂O + light ──> C₆H₁₂O₆ + 6 O₂', x: 180, y: 260, isMath: true },
      { text: 'Where glucose is produced and oxygen is released.', x: 120, y: 330 },
    ],
  },
  {
    pageNumber: 4,
    lines: [
      { text: 'Q5 (Extra)', x: 120, y: 230, isLabel: true },
      { text: 'Mitochondria is the powerhouse of the cell because', x: 120, y: 270 },
      { text: 'it generates most of the ATP (Adenosine Triphosphate),', x: 120, y: 310 },
      { text: 'which acts as chemical energy currency for cellular tasks.', x: 120, y: 350 },
    ],
  },
];

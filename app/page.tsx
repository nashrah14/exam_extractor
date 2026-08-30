/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, FileText, Settings, Users, BookOpen, LogOut, ArrowLeft 
} from 'lucide-react';
import { UploadPanel } from '@/components/UploadPanel';
import { ProcessingProgress } from '@/components/ProcessingProgress';
import { QuestionList } from '@/components/QuestionList';
import { AnswerViewer } from '@/components/AnswerViewer';
import { LayoutShell } from '@/components/LayoutShell';
import { convertPdfToImages, convertImageToRenderedPage, RenderedPage } from '@/lib/utils/pdf';
import { 
  Question, Answer, AnswerMapping, GradingResult, 
  ProcessingStatus, AssessmentResult 
} from '@/lib/types';
import { demoAssessmentResult } from '@/lib/demo-data';

export default function Home() {
  // App States
  const [appState, setAppState] = useState<'upload' | 'processing' | 'results'>('upload');
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [mobileActiveTab, setMobileActiveTab] = useState<'Questions' | 'Answer Sheet'>('Questions');

  // File states (cache rendered pages client-side)
  const [questionPages, setQuestionPages] = useState<RenderedPage[]>([]);
  const [answerPages, setAnswerPages] = useState<RenderedPage[]>([]);

  // Store uploaded files for retry functionality
  const lastFilesRef = useRef<{ qp: File | null; as: File | null }>({ qp: null, as: null });

  // Processing Stage States
  const [status, setStatus] = useState<ProcessingStatus>({
    stage: 'idle',
    progress: 0,
    message: '',
  });

  // Results State
  const [result, setResult] = useState<AssessmentResult>({
    assessmentId: '',
    questions: [],
    answers: [],
    mappings: [],
    gradings: {},
    unmatchedAnswers: [],
    gradingStatus: 'not_started',
  });

  // UI Selection State
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(null);
  const [selectedAnswerId, setSelectedAnswerId] = useState<string | null>(null);
  const [isUnmatchedSelected, setIsUnmatchedSelected] = useState(false);

  // Set default selection when results load
  useEffect(() => {
    if (appState === 'results') {
      if (result.questions.length > 0) {
        const firstQ = result.questions[0];
        const mapping = result.mappings.find(m => m.questionId === firstQ.id);
        setSelectedQuestionId(firstQ.id);
        setSelectedAnswerId(mapping?.answerId || null);
        setIsUnmatchedSelected(false);
        setMobileActiveTab('Questions');
      } else if (result.unmatchedAnswers.length > 0) {
        const firstUnmatched = result.unmatchedAnswers[0];
        setSelectedQuestionId(firstUnmatched.id);
        setSelectedAnswerId(firstUnmatched.id);
        setIsUnmatchedSelected(true);
        setMobileActiveTab('Questions');
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appState, result]);

  // Handler for Demo Mode
  const handleLaunchDemo = () => {
    setIsDemoMode(true);
    setAppState('results');
    setResult(demoAssessmentResult);
  };

  // Main PDF & API pipeline runner
  const handleAnalyze = async (qpFile: File, asFile: File) => {
    lastFilesRef.current = { qp: qpFile, as: asFile };
    setAppState('processing');
    setIsDemoMode(false);
    setStatus({
      stage: 'rendering_pdf',
      progress: 5,
      message: 'Initializing and loading document files...',
    });

    let qPages: RenderedPage[] = [];
    let aPages: RenderedPage[] = [];

    try {
      // 1. Render Question Paper to images
      setStatus({
        stage: 'rendering_pdf',
        progress: 10,
        message: 'Rendering Question Paper pages client-side...',
      });
      if (qpFile.type === 'application/pdf') {
        qPages = await convertPdfToImages(qpFile);
      } else {
        const single = await convertImageToRenderedPage(qpFile);
        qPages = [single];
      }
      setQuestionPages(qPages);

      // 2. Render Answer Sheet to images
      setStatus({
        stage: 'rendering_pdf',
        progress: 18,
        message: 'Rendering handwritten Student Answer Sheet pages...',
      });
      if (asFile.type === 'application/pdf') {
        aPages = await convertPdfToImages(asFile);
      } else {
        const single = await convertImageToRenderedPage(asFile);
        aPages = [single];
      }
      setAnswerPages(aPages);

      // 3. Stage 1: Question Extraction
      setStatus({
        stage: 'extracting_questions',
        progress: 25,
        message: `Extracting questions from paper (${qPages.length} pages)...`,
      });

      const extractedQuestions: Question[] = [];
      let questionIndex = 1;

      for (let i = 0; i < qPages.length; i++) {
        setStatus({
          stage: 'extracting_questions',
          progress: Math.round(25 + (i / qPages.length) * 15),
          message: `OCR scanning Question Paper page ${i + 1} of ${qPages.length}...`,
        });

        const res = await fetch('/api/extract-questions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pageImage: qPages[i].dataUrl, pageNumber: i + 1 }),
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || 'Failed to extract questions.');
        }

        const data = await res.json();
        if (data.questions && Array.isArray(data.questions)) {
          data.questions.forEach((q: any) => {
            extractedQuestions.push({
              id: `q_extracted_${questionIndex++}`,
              number: q.number,
              text: q.text,
              parentNumber: q.parentNumber || null,
              subPart: q.subPart || null,
              confidence: q.confidence || 0.9,
              page: i + 1,
              bbox: q.bbox || null,
            });
          });
        }
      }

      if (extractedQuestions.length === 0) {
        throw new Error('No questions could be extracted from the question paper. Please upload a clear layout.');
      }

      // 4. Stage 2: Answer Extraction
      setStatus({
        stage: 'extracting_answers',
        progress: 40,
        message: `Extracting handwritten answers (${aPages.length} pages)...`,
      });

      const rawExtractedAnswers: Answer[] = [];
      let answerIndex = 1;

      for (let i = 0; i < aPages.length; i++) {
        setStatus({
          stage: 'extracting_answers',
          progress: Math.round(40 + (i / aPages.length) * 25),
          message: `Transcribing handwriting regions on Answer Sheet page ${i + 1} of ${aPages.length}...`,
        });

        const res = await fetch('/api/extract-answers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pageImage: aPages[i].dataUrl, pageNumber: i + 1 }),
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || 'Failed to extract answers.');
        }

        const data = await res.json();
        if (data.answers && Array.isArray(data.answers)) {
          data.answers.forEach((ans: any) => {
            const mappedRegions = ans.regions && Array.isArray(ans.regions)
              ? ans.regions.map((reg: any) => ({
                  page: i + 1,
                  bbox: reg.bbox,
                  type: reg.type || 'text',
                  confidence: reg.confidence || 0.9,
                }))
              : [{
                  page: i + 1,
                  bbox: ans.bbox,
                  type: 'mixed',
                  confidence: ans.confidence || 0.9,
                }];

            const mappedVisualElements = ans.visualElements && Array.isArray(ans.visualElements)
              ? ans.visualElements.map((vel: any, idx: number) => ({
                  id: `vel_${answerIndex}_${idx}`,
                  type: vel.type || 'diagram',
                  description: vel.description || '',
                  page: i + 1,
                  bbox: vel.bbox,
                  labels: vel.labels || [],
                  confidence: vel.confidence || 0.9,
                }))
              : [];

            rawExtractedAnswers.push({
              id: `ans_extracted_${answerIndex++}`,
              rawQuestionReference: ans.rawQuestionReference,
              normalizedQuestionReference: ans.rawQuestionReference.replace(/[^0-9(a-z)]/gi, ''),
              text: ans.text,
              confidence: ans.confidence || 0.85,
              regions: mappedRegions,
              visualElements: mappedVisualElements,
              hasDiagram: ans.hasDiagram ?? false,
              hasEquation: ans.hasEquation ?? false,
              hasTable: ans.hasTable ?? false,
              hasGraph: ans.hasGraph ?? false,
              hasDrawing: ans.hasDrawing ?? false,
            });
          });
        }
      }

      // 5. Stage 3: Answer Mapping
      setStatus({
        stage: 'mapping_answers',
        progress: 70,
        message: 'Mapping student answers to question requirements...',
      });

      const mapRes = await fetch('/api/map-answers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questions: extractedQuestions, answers: rawExtractedAnswers }),
      });

      if (!mapRes.ok) {
        const errData = await mapRes.json();
        throw new Error(errData.error || 'Failed to map answers.');
      }

      const mapData = await mapRes.json();
      const rawMappings: AnswerMapping[] = mapData.mappings || [];

      // Consolidate answers spanning multiple pages
      const processedAnswers: Answer[] = [];
      const finalMappings: AnswerMapping[] = [];
      const unmatchedAnswers: Answer[] = [];

      const mappedRawAnswerIds = new Set<string>();

      extractedQuestions.forEach((q) => {
        const questionMappings = rawMappings.filter((m) => m.questionId === q.id);
        const mappedAnswerItems = questionMappings
          .map((qm) => rawExtractedAnswers.find((ans) => ans.id === qm.answerId))
          .filter(Boolean) as Answer[];

        if (mappedAnswerItems.length > 0) {
          // Merge multiple answers for the same question
          const mergedText = mappedAnswerItems.map((ans) => ans.text).join('\n[Continuation]: ');
          const mergedRegions = mappedAnswerItems.flatMap((ans) => ans.regions);
          const mergedVisualElements = mappedAnswerItems.flatMap((ans) => ans.visualElements || []);
          const hasDiagram = mappedAnswerItems.some((ans) => ans.hasDiagram);
          const hasEquation = mappedAnswerItems.some((ans) => ans.hasEquation);
          const hasTable = mappedAnswerItems.some((ans) => ans.hasTable);
          const hasGraph = mappedAnswerItems.some((ans) => ans.hasGraph);
          const hasDrawing = mappedAnswerItems.some((ans) => ans.hasDrawing);
          const avgConfidence = mappedAnswerItems.reduce((sum, ans) => sum + ans.confidence, 0) / mappedAnswerItems.length;

          const mergedAnswerId = `ans_merged_${q.id}`;
          processedAnswers.push({
            id: mergedAnswerId,
            rawQuestionReference: mappedAnswerItems[0].rawQuestionReference,
            normalizedQuestionReference: q.number,
            text: mergedText,
            regions: mergedRegions,
            visualElements: mergedVisualElements,
            hasDiagram,
            hasEquation,
            hasTable,
            hasGraph,
            hasDrawing,
            confidence: parseFloat(avgConfidence.toFixed(2)),
          });

          mappedAnswerItems.forEach((item) => mappedRawAnswerIds.add(item.id));

          const highestMapConf = Math.max(...questionMappings.map((m) => m.confidence));
          const primaryMapping = questionMappings.find((m) => m.confidence === highestMapConf);

          finalMappings.push({
            questionId: q.id,
            answerId: mergedAnswerId,
            status: primaryMapping?.status || 'matched',
            confidence: highestMapConf,
            reason: primaryMapping?.reason || 'Mapped via semantic evaluation.',
          });
        } else {
          finalMappings.push({
            questionId: q.id,
            answerId: null,
            status: 'unanswered',
            confidence: 1.0,
            reason: 'No student answer was detected for this question.',
          });
        }
      });

      rawExtractedAnswers.forEach((ans) => {
        if (!mappedRawAnswerIds.has(ans.id)) {
          unmatchedAnswers.push(ans);
        }
      });

      // 6. Stage 4: AI Grading (Optional Loop)
      setStatus({
        stage: 'grading',
        progress: 85,
        message: 'Grading student responses using AI evaluation criteria...',
      });

      const gradings: Record<string, GradingResult> = {};
      const matchedMappings = finalMappings.filter((m) => m.status === 'matched');
      let gradingStatus: 'completed' | 'failed' = 'completed';

      for (let k = 0; k < matchedMappings.length; k++) {
        const mapping = matchedMappings[k];
        const question = extractedQuestions.find((q) => q.id === mapping.questionId)!;
        const answer = processedAnswers.find((a) => a.id === mapping.answerId)!;

        setStatus({
          stage: 'grading',
          progress: Math.round(85 + (k / matchedMappings.length) * 15),
          message: `Grading Q${question.number} answer feedback...`,
        });

        try {
          const answerPageNumbers = Array.from(new Set(answer.regions.map(r => r.page)));
          const studentAnswerPageImages = answerPageNumbers.map(pageNum => {
            const pageObj = answerPages.find(p => p.pageNumber === pageNum);
            return pageObj ? pageObj.dataUrl : null;
          }).filter(Boolean) as string[];

          // Extract maxScore from question text if available (e.g. "[5 marks]", "(3 marks)", "[10]")
          const marksMatch = question.text.match(/\[(\d+)\s*(?:marks?|pts?|points?)?\]|\((\d+)\s*(?:marks?|pts?|points?)\)/i);
          const dynamicMaxScore = marksMatch ? parseInt(marksMatch[1] || marksMatch[2], 10) : 5;

          const gradeRes = await fetch('/api/grade-answer', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              questionNumber: question.number,
              questionText: question.text,
              maxScore: dynamicMaxScore,
              studentAnswerText: answer.text,
              studentAnswerVisualElements: answer.visualElements,
              studentAnswerPageImages,
            }),
          });

          if (gradeRes.ok) {
            const gradeData = await gradeRes.json();
            gradings[question.id] = gradeData;
          } else {
            gradingStatus = 'failed';
          }
        } catch (gradeError) {
          console.warn(`Grading failed for question ${question.id}:`, gradeError);
          gradingStatus = 'failed';
        }
      }


      // Success complete
      setStatus({ stage: 'completed', progress: 100, message: 'Processing finished successfully!' });
      setResult({
        assessmentId: `assessment_${Date.now()}`,
        questions: extractedQuestions,
        answers: processedAnswers,
        mappings: finalMappings,
        gradings,
        unmatchedAnswers,
        gradingStatus,
      });
      setAppState('results');
    } catch (err: any) {
      console.error('Extraction pipeline failure:', err);
      setStatus({
        stage: 'error',
        progress: 0,
        message: 'Pipeline execution halted.',
        error: err.message || 'An unknown server error occurred. Please try again.',
      });
    }
  };

  const handleSelectQuestion = (qId: string | null, aId: string | null, isUnmatched = false) => {
    setSelectedQuestionId(qId);
    setSelectedAnswerId(aId);
    setIsUnmatchedSelected(isUnmatched);
    // On mobile, automatically show the highlighted viewer when a question is clicked!
    setMobileActiveTab('Answer Sheet');
  };

  // Find selection objects helper
  const getSelectionDetails = () => {
    if (isUnmatchedSelected) {
      const unmatched = result.unmatchedAnswers.find(ans => ans.id === selectedQuestionId);
      return {
        selectedQuestion: null,
        selectedAnswer: unmatched || null,
        selectedMapping: null,
        grading: null,
      };
    }

    const question = result.questions.find(q => q.id === selectedQuestionId) || null;
    const answer = result.answers.find(a => a.id === selectedAnswerId) || null;
    const mapping = result.mappings.find(m => m.questionId === selectedQuestionId) || null;
    const grading = selectedQuestionId ? result.gradings[selectedQuestionId] || null : null;

    return {
      selectedQuestion: question,
      selectedAnswer: answer,
      selectedMapping: mapping,
      grading,
    };
  };

  const { selectedQuestion, selectedAnswer, selectedMapping, grading } = getSelectionDetails();

  // Bounding box compilation
  const getActiveHighlightRegions = () => {
    if (isUnmatchedSelected && selectedAnswer) {
      return selectedAnswer.regions;
    }
    return selectedAnswer ? selectedAnswer.regions : [];
  };

  return (
    <LayoutShell>
      <div className="h-full overflow-hidden">
        
        {/* UPLOAD SCREEN */}
        {appState === 'upload' && (
          <UploadPanel 
            onAnalyze={handleAnalyze} 
            onLaunchDemo={handleLaunchDemo} 
          />
        )}

        {/* PIPELINE PROCESSING SCREEN */}
        {appState === 'processing' && (
          <ProcessingProgress 
            status={status} 
            onRetry={() => {
              const { qp, as: asFile } = lastFilesRef.current;
              if (qp && asFile) handleAnalyze(qp, asFile);
              else setAppState('upload');
            }}
            onCancel={() => setAppState('upload')}
          />
        )}

        {/* RESULTS 2-COLUMN INSPECTOR WORKSPACE */}
        {appState === 'results' && (
          <section className="mx-auto flex h-full min-h-0 flex-col p-0 lg:p-2">
            {/* Mobile Tab Switcher */}
            <div className="mb-4 m-4 flex rounded-full bg-white shadow-[0_2px_10px_rgba(0,0,0,0.05)] border border-slate-100 p-1.5 lg:hidden">
              <button
                onClick={() => setMobileActiveTab("Questions")}
                className={`flex-1 rounded-full py-2.5 text-[15px] font-semibold transition-colors ${
                  mobileActiveTab === "Questions" ? "bg-[#2B2B2B] text-white shadow-md font-bold" : "text-slate-500 hover:text-slate-800 font-semibold"
                }`}
              >
                Questions
              </button>
              <button
                onClick={() => setMobileActiveTab("Answer Sheet")}
                className={`flex-1 rounded-full py-2.5 text-[15px] font-semibold transition-colors ${
                  mobileActiveTab === "Answer Sheet" ? "bg-[#2B2B2B] text-white shadow-md font-bold" : "text-slate-500 hover:text-slate-800 font-semibold"
                }`}
              >
                Answer Sheet
              </button>
            </div>

            {/* Main Grid Workspace */}
            <div className="flex min-h-0 flex-1 flex-col gap-4 sm:gap-6 lg:flex-row overflow-hidden p-4 lg:p-0">
              {/* Left Column: Sidebar Question List (420px Width) */}
              <div className={`flex w-full flex-col overflow-hidden rounded-[20px] sm:rounded-3xl bg-white shadow-sm lg:w-[420px] ${
                mobileActiveTab === "Questions" ? "flex flex-1" : "hidden lg:flex"
              }`}>
                <div className="flex items-center justify-between border-b border-slate-100 px-4 sm:px-6 py-4">
                  <h2 className="text-[15px] font-bold text-slate-900">
                    Extracted Questions <span className="block sm:inline text-slate-400 font-normal">(from question paper)</span>
                  </h2>
                </div>
                <div className="flex-1 overflow-y-auto no-scrollbar">
                  <QuestionList
                    questions={result.questions}
                    answers={result.answers}
                    mappings={result.mappings}
                    gradings={result.gradings}
                    unmatchedAnswers={result.unmatchedAnswers}
                    selectedQuestionId={selectedQuestionId}
                    onSelectQuestion={handleSelectQuestion}
                    gradingStatus={result.gradingStatus}
                  />
                </div>
              </div>

              {/* Right Column: Answer Page Canvas Viewer (flex-1 Width) */}
              <div className={`flex flex-1 flex-col overflow-hidden rounded-[20px] sm:rounded-3xl bg-[#DCE0E5] shadow-sm ${
                mobileActiveTab === "Answer Sheet" ? "flex flex-1" : "hidden lg:flex"
              }`}>
                <AnswerViewer
                  pages={answerPages}
                  activeRegions={getActiveHighlightRegions()}
                  selectedLabel={
                    isUnmatchedSelected && selectedAnswer
                      ? `${selectedAnswer.rawQuestionReference}`
                      : selectedQuestion
                      ? `${selectedQuestion.number}`
                      : ''
                  }
                  isDemoMode={isDemoMode}
                  selectedAnswer={selectedAnswer}
                />
              </div>
            </div>
          </section>
        )}

      </div>
    </LayoutShell>
  );
}

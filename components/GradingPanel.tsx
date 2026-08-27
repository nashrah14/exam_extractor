/* eslint-disable react/no-unescaped-entities */
import React from 'react';
import { Award, AlertTriangle, Sparkles, CheckCircle2, HelpCircle, GraduationCap, RefreshCw } from 'lucide-react';
import { Question, Answer, AnswerMapping, GradingResult } from '@/lib/types';

interface GradingPanelProps {
  selectedQuestion: Question | null;
  selectedAnswer: Answer | null;
  selectedMapping: AnswerMapping | null;
  grading: GradingResult | null;
  isUnmatched?: boolean;
  gradingStatus?: 'not_started' | 'processing' | 'completed' | 'failed';
}

export const GradingPanel: React.FC<GradingPanelProps> = ({
  selectedQuestion,
  selectedAnswer,
  selectedMapping,
  grading,
  isUnmatched = false,
  gradingStatus = 'not_started',
}) => {
  // If nothing is selected, show empty state
  if (!selectedQuestion && !selectedAnswer && !selectedMapping) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center text-slate-400 bg-white">
        <HelpCircle className="h-10 w-10 text-slate-300 mb-3" />
        <h3 className="text-sm font-bold text-slate-700">No Item Selected</h3>
        <p className="text-xs text-slate-400 max-w-[200px] mt-1">
          Select a question from the sidebar to inspect the student's answer and AI grading feedback.
        </p>
      </div>
    );
  }

  // Handle Unmatched Answer sheet rendering
  if (isUnmatched && selectedAnswer) {
    return (
      <div className="flex flex-col h-full bg-white">
        {/* Unmatched Header */}
        <div className="p-6 border-b border-slate-100 bg-purple-50/20">
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-purple-700 bg-purple-100 px-2.5 py-1 rounded-full border border-purple-200 mb-3">
            <AlertTriangle className="h-3 w-3" /> Unmatched Student Writing
          </span>
          <h2 className="text-xl font-bold text-slate-900 leading-tight">
            Extra Answer Block: "{selectedAnswer.rawQuestionReference || 'Unlabeled'}"
          </h2>
          <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
            This block of handwritten text was extracted from the student's answer sheet, but could not be confidently mapped to any question on the exam paper.
          </p>
        </div>

        {/* Content Box */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5">
              Extracted Handwriting Transcript
            </h4>
            <div className="p-5 bg-purple-50/10 border border-purple-100 rounded-xl font-medium text-slate-700 text-sm leading-relaxed italic shadow-sm">
              "{selectedAnswer.text}"
            </div>
          </div>

          {/* Render Visual elements for unmatched block */}
          {selectedAnswer.visualElements && selectedAnswer.visualElements.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5">
                Visual Elements Detected (Multimodal)
              </h4>
              <div className="space-y-2.5">
                {selectedAnswer.visualElements.map((vel) => (
                  <div key={vel.id} className="p-3 bg-purple-50/5 border border-purple-100/60 rounded-lg">
                    <div className="flex justify-between items-start gap-2 mb-1.5">
                      <span className="text-[10px] font-extrabold uppercase tracking-wide px-2 py-0.5 rounded bg-purple-100 text-purple-700 border border-purple-200">
                        {vel.type}
                      </span>
                      <span className="text-[10px] text-slate-400 font-bold">
                        Page {vel.page}
                      </span>
                    </div>
                    <p className="text-xs font-medium text-slate-700 leading-relaxed">
                      {vel.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
            <h4 className="text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
              Why wasn't this mapped?
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              The student labeled this as "{selectedAnswer.rawQuestionReference || 'Unlabeled'}". Since there is no question with this numbering or matching semantic topic on the question paper, it remains unmatched to prevent accidental grading.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Handle Unanswered Question sheet rendering
  if (selectedQuestion && selectedMapping?.status === 'unanswered') {
    return (
      <div className="flex flex-col h-full bg-white">
        {/* Unanswered Header */}
        <div className="p-6 border-b border-slate-100 bg-red-50/20">
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-700 bg-red-100 px-2.5 py-1 rounded-full border border-red-200 mb-3">
            <X className="h-3.5 w-3.5" /> Skip State
          </span>
          <h2 className="text-xl font-bold text-slate-900 leading-tight">
            Question {selectedQuestion.number} (Unanswered)
          </h2>
          <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
            {selectedQuestion.text}
          </p>
        </div>

        {/* Empty state list */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center justify-center text-center">
          <div className="p-4 bg-red-50 text-red-500 rounded-full mb-4 border border-red-100">
            <AlertTriangle className="h-8 w-8" />
          </div>
          <h3 className="text-sm font-bold text-slate-700">No Student Answer Found</h3>
          <p className="text-xs text-slate-400 max-w-[280px] mt-1.5 leading-relaxed">
            The AI analyzed the entire handwritten answer sheet and found no responses matching this question numbering or context.
          </p>
        </div>
      </div>
    );
  }

  // Helper for evaluation pill styles
  const getEvaluationStyles = (evalText: string = '') => {
    const text = evalText.toLowerCase();
    if (text.includes('correct') && !text.includes('partial') && !text.includes('in')) {
      return 'bg-emerald-50 text-emerald-700 border-emerald-100';
    }
    if (text.includes('partial')) {
      return 'bg-amber-50 text-amber-700 border-amber-100';
    }
    return 'bg-red-50 text-red-700 border-red-100';
  };

  // Main Question & Answer + Grading view
  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header Panel */}
      <div className="p-6 border-b border-slate-100 bg-slate-50/30">
        <div className="flex justify-between items-start gap-4 mb-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-slate-100 text-slate-800">
            Question {selectedQuestion?.number}
          </span>
          {selectedMapping?.status === 'ambiguous' && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-100 px-2.5 py-1 rounded-full border border-amber-200">
              <AlertTriangle className="h-3 w-3" /> Needs Review
            </span>
          )}
        </div>
        <h2 className="text-lg font-bold text-slate-900 leading-snug mb-1">
          {selectedQuestion?.text}
        </h2>
        {selectedMapping && (
          <p className="text-[10px] text-slate-400 font-medium">
            Mapping Method: <span className="text-slate-600 font-semibold">{selectedMapping.reason}</span>
          </p>
        )}
      </div>

      {/* Main Details Panel */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Student Handwriting Transcript */}
        <div>
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5">
            Student Answer Transcript
          </h4>
          <div className="p-5 bg-slate-50 border border-slate-200/60 rounded-xl font-medium text-slate-800 text-sm leading-relaxed italic shadow-sm relative">
            "{selectedAnswer?.text}"
            <span className="absolute -bottom-2.5 right-4 text-[9px] bg-slate-100 text-slate-400 px-2 py-0.5 rounded border border-slate-200 uppercase font-semibold">
              OCR Confidence: {selectedAnswer ? Math.round(selectedAnswer.confidence * 100) : 0}%
            </span>
          </div>
        </div>

        {/* Visual Elements List (multimodal information) */}
        {selectedAnswer && selectedAnswer.visualElements && selectedAnswer.visualElements.length > 0 && (
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5">
              Visual Elements Detected (Multimodal)
            </h4>
            <div className="space-y-2.5">
              {selectedAnswer.visualElements.map((vel) => (
                <div key={vel.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <div className="flex justify-between items-start gap-2 mb-1.5">
                    <span className="text-[10px] font-extrabold uppercase tracking-wide px-2 py-0.5 rounded bg-violet-100 text-violet-700 border border-violet-200">
                      {vel.type}
                    </span>
                    <span className="text-[10px] text-slate-450 font-bold">
                      Page {vel.page} (Confidence: {Math.round(vel.confidence * 100)}%)
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-slate-700 leading-relaxed">
                    {vel.description}
                  </p>
                  {vel.labels && vel.labels.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {vel.labels.map((lbl, idx) => (
                        <span key={idx} className="text-[9px] font-bold text-slate-500 bg-slate-200 px-1.5 py-0.5 rounded">
                          {lbl}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* AI Grading Section */}
        {gradingStatus === 'failed' ? (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-center text-red-700">
            <AlertTriangle className="h-6 w-6 mx-auto mb-1.5 text-red-500 animate-pulse" />
            <p className="text-xs font-bold">AI Grading Failed / Unavailable</p>
            <p className="text-[11px] text-red-600 mt-0.5 font-medium">
              Configure GEMINI_API_KEY in your environment variables to unlock automatic AI grading of student responses.
            </p>
          </div>
        ) : gradingStatus === 'processing' && !grading ? (
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-center text-slate-650">
            <RefreshCw className="h-6 w-6 mx-auto mb-1.5 text-violet-500 animate-spin" />
            <p className="text-xs font-bold">AI Evaluation in Progress...</p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Evaluating the student transcript and diagrams using gemini-3.6-flash.
            </p>
          </div>
        ) : grading ? (
          <div className="border border-slate-150 rounded-xl overflow-hidden shadow-sm">
            {/* Score header */}
            <div className="flex items-center justify-between px-5 py-4 bg-slate-50 border-b border-slate-100">
              <div className="flex items-center gap-2 text-slate-800">
                <Award className="h-4.5 w-4.5 text-violet-600" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">AI Evaluation</span>
              </div>
              <div className="flex items-center gap-3">
                <span className={`px-2.5 py-0.5 text-xs font-extrabold rounded-full border ${getEvaluationStyles(grading.evaluation)}`}>
                  {grading.evaluation}
                </span>
                <span className="text-sm font-extrabold text-slate-800">
                  {grading.score} / {grading.maxScore} marks
                </span>
              </div>
            </div>

            {/* Critique Details */}
            <div className="p-5 space-y-5 bg-white">
              {/* Feedback */}
              <div>
                <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Explanation & Feedback
                </h5>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {grading.feedback}
                </p>
              </div>

              {/* Strengths / Suggestions */}
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <div className="bg-emerald-50/20 border border-emerald-50 rounded-lg p-3">
                  <h6 className="text-[10px] font-extrabold text-emerald-800 uppercase mb-1.5 flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Key Strengths
                  </h6>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {grading.strengths}
                  </p>
                </div>
                
                <div className="bg-amber-50/20 border border-amber-50 rounded-lg p-3">
                  <h6 className="text-[10px] font-extrabold text-amber-800 uppercase mb-1.5 flex items-center gap-1">
                    <Sparkles className="h-3.5 w-3.5 text-amber-600" /> Suggestions & Missing Concepts
                  </h6>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {grading.missingConcepts}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-center">
            <GraduationCap className="h-6 w-6 text-slate-400 mx-auto mb-1.5" />
            <p className="text-xs font-bold text-slate-700">AI Grading Pending</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Select an answered question to inspect its evaluation feedback.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

// Helper components for icons
const X: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);

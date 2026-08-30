'use client';

import React, { useState } from 'react';
import { 
  ChevronDown, ChevronUp, CheckCircle2, Sparkles, Award, Search, 
  FileText, Check, X, AlertTriangle 
} from 'lucide-react';
import { Question, Answer, AnswerMapping, GradingResult } from '@/lib/types';

interface QuestionListProps {
  questions: Question[];
  answers: Answer[];
  mappings: AnswerMapping[];
  gradings: Record<string, GradingResult>;
  unmatchedAnswers: Answer[];
  selectedQuestionId: string | null;
  onSelectQuestion: (questionId: string | null, answerId: string | null, isUnmatched?: boolean) => void;
  gradingStatus?: 'not_started' | 'processing' | 'completed' | 'failed';
}

type FilterType = 'all' | 'answered' | 'unanswered' | 'review' | 'unmatched';

export const QuestionList: React.FC<QuestionListProps> = ({
  questions,
  answers,
  mappings,
  gradings,
  unmatchedAnswers,
  selectedQuestionId,
  onSelectQuestion,
  gradingStatus = 'not_started',
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');

  const getQuestionMapping = (qId: string) => {
    return mappings.find((m) => m.questionId === qId);
  };

  const getQuestionGrading = (qId: string) => {
    return gradings[qId];
  };

  // Filter logic
  const filteredQuestions = questions.filter((q) => {
    const mapping = getQuestionMapping(q.id);

    // Search query match
    const matchesSearch =
      q.number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.text.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    // Status filter match
    if (activeFilter === 'all') return true;
    if (activeFilter === 'answered') return mapping?.status === 'matched';
    if (activeFilter === 'unanswered') return mapping?.status === 'unanswered';
    if (activeFilter === 'review') return mapping?.status === 'ambiguous';
    return false;
  });

  // Calculate metrics
  const totalQuestions = questions.length;
  const answeredCount = mappings.filter((m) => m.status === 'matched').length;
  const unansweredCount = mappings.filter((m) => m.status === 'unanswered').length;
  const reviewCount = mappings.filter((m) => m.status === 'ambiguous').length;

  const answeredQuestions = mappings.filter(
    (m) => m.status === 'matched' || m.status === 'ambiguous'
  ).length;

  const totalObtained = questions.reduce((sum, q) => {
    const mapping = getQuestionMapping(q.id);
    const grade = getQuestionGrading(q.id);
    if (mapping?.status === 'unanswered') return sum;
    const scoreVal = grade ? Number(grade.score) : 0;
    return sum + (isNaN(scoreVal) ? 0 : scoreVal);
  }, 0);

  const totalPossible = questions.reduce((sum, q) => {
    const mapping = getQuestionMapping(q.id);
    const grade = getQuestionGrading(q.id);
    if (mapping?.status === 'unanswered') return sum + 5;
    const maxScoreVal = grade ? Number(grade.maxScore) : 5;
    return sum + (isNaN(maxScoreVal) ? 5 : maxScoreVal);
  }, 0);

  const percentage = totalPossible > 0 ? (totalObtained / totalPossible) * 100 : 0;
  const evaluatedQuestions = questions.filter((q) => {
    const mapping = getQuestionMapping(q.id);
    if (mapping?.status === 'unanswered') return false;
    const grade = getQuestionGrading(q.id);
    return !!grade && typeof grade.score === 'number' && !isNaN(grade.score);
  }).length;

  const evaluationComplete = (evaluatedQuestions === answeredQuestions) && (gradingStatus === 'completed');
  const formattedPercentage = percentage % 1 === 0 ? percentage.toFixed(0) : percentage.toFixed(1);

  const getEvaluationStyles = (evalText: string = '') => {
    const text = evalText.toLowerCase();
    if (text.includes('correct') && !text.includes('partial') && !text.includes('in')) {
      return 'bg-[#E6F6E9] text-[#1DB335] border-[#1DB335]/20';
    }
    if (text.includes('partial')) {
      return 'bg-amber-50 text-amber-705 border-amber-200';
    }
    return 'bg-[#FCECE8] text-[#EA643A] border-[#EA643A]/20';
  };

  return (
    <div className="flex flex-col h-full bg-transparent text-slate-800 select-none overflow-hidden">
      {/* Search & Filter Header */}
      <div className="p-4 border-b border-slate-100 space-y-3 bg-white">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search questions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 pl-9 pr-4 py-2 rounded-xl text-xs font-semibold text-slate-700 placeholder-slate-400 focus:outline-none focus:border-[#EA643A] transition-all"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap gap-1.5">
          {(
            [
              { id: 'all', label: 'All' },
              { id: 'answered', label: `Answered (${answeredCount})` },
              { id: 'unanswered', label: `Unanswered (${unansweredCount})` },
              { id: 'review', label: `Review (${reviewCount})` },
              { id: 'unmatched', label: `Unmatched (${unmatchedAnswers.length})` },
            ] as const
          ).map((filter) => (
            <button
              key={filter.id}
              onClick={() => setActiveFilter(filter.id)}
              className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition-all cursor-pointer ${
                activeFilter === filter.id
                  ? 'bg-[#EA643A] text-white shadow-sm'
                  : 'bg-slate-100 text-slate-500 hover:text-slate-700 hover:bg-slate-200'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* Overall Score Card */}
      {activeFilter !== 'unmatched' && (
        <div className="mx-4 mt-4 p-4 bg-white border border-slate-100 rounded-2xl text-center shadow-sm relative overflow-hidden flex-shrink-0">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Overall Assessment Score
          </div>
          
          <div className="flex flex-col items-center justify-center space-y-0.5 mt-1.5">
            <span className="text-3xl font-extrabold text-[#272727] tracking-tight">
              {totalObtained} <span className="text-slate-400 text-xl font-medium">/</span> {totalPossible}
            </span>
            <span className="text-[11px] font-bold text-[#EA643A] px-2.5 py-0.5 bg-[#f9e4da] rounded-full">
              {formattedPercentage}%
            </span>
          </div>

          <div className="text-[9px] font-bold text-slate-400 flex items-center justify-center gap-1.5 pt-2 border-t border-slate-100 mt-3">
            <span className={`inline-block h-1.5 w-1.5 rounded-full ${evaluationComplete ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
            <span>
              {evaluationComplete ? 'Final Evaluation Score' : 'Grading In Progress'}
            </span>
          </div>
        </div>
      )}

      {/* Questions Scrollable List */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 pt-2 space-y-3 no-scrollbar">
        {activeFilter !== 'unmatched' && (
          <>
            {filteredQuestions.length === 0 ? (
              <div className="text-center py-8 text-xs font-semibold text-slate-400">
                No matching questions found.
              </div>
            ) : (
              filteredQuestions.map((q) => {
                const mapping = getQuestionMapping(q.id);
                const grade = getQuestionGrading(q.id);
                const isSelected = selectedQuestionId === q.id;

                const answer = mapping?.answerId ? answers.find((a) => a.id === mapping.answerId) : null;
                const requiresDiagram =
                  q.text.toLowerCase().includes('diagram') ||
                  q.text.toLowerCase().includes('draw') ||
                  q.text.toLowerCase().includes('illustration') ||
                  q.text.toLowerCase().includes('sketch');

                const hasDiagram = answer ? (answer.hasDiagram || answer.hasDrawing) : false;
                const hasEquation = answer ? answer.hasEquation : false;
                const hasTable = answer ? answer.hasTable : false;

                let scoreText = mapping?.status || 'UNANSWERED';
                let scoreBg = "bg-slate-100";
                let scoreColor = "text-slate-500";

                if (mapping?.status === 'matched') {
                  scoreText = grade ? `${grade.score}/${grade.maxScore}` : "ANSWERED";
                  if (grade) {
                    if (grade.score === grade.maxScore) {
                      scoreBg = "bg-[#E6F6E9]";
                      scoreColor = "text-[#1DB335]";
                    } else if (grade.score > 0) {
                      scoreBg = "bg-amber-50";
                      scoreColor = "text-amber-600";
                    } else {
                      scoreBg = "bg-[#FCECE8]";
                      scoreColor = "text-[#EA643A]";
                    }
                  } else {
                    scoreBg = "bg-[#E6F6E9]";
                    scoreColor = "text-[#1DB335]";
                  }
                } else if (mapping?.status === 'unanswered') {
                  scoreText = 'SKIP';
                  scoreBg = 'bg-[#FCECE8]';
                  scoreColor = 'text-[#EA643A]';
                } else if (mapping?.status === 'ambiguous') {
                  scoreText = 'REVIEW';
                  scoreBg = 'bg-amber-50';
                  scoreColor = 'text-amber-600';
                }

                return (
                  <div key={q.id} className="group flex flex-col transition-all duration-200">
                    <div
                      onClick={() => onSelectQuestion(q.id, mapping?.answerId || null)}
                      role="button"
                      tabIndex={0}
                      className={`flex w-full flex-col p-4 sm:p-5 text-left cursor-pointer transition-all ${
                        isSelected
                          ? "rounded-2xl border-2 border-[#EA643A] bg-white shadow-md z-10 relative"
                          : "rounded-2xl bg-white shadow-sm border border-slate-100 hover:shadow-md"
                      }`}
                    >
                      {/* Top Row: Number, Score & Chevron */}
                      <div className="flex w-full items-center justify-between mb-3">
                        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#515151] text-[14px] font-bold text-white shadow-sm">
                          {q.number}
                        </div>

                        <div className="flex items-center gap-2">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${scoreBg} ${scoreColor}`}>
                            {scoreText}
                          </span>
                          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#F5F6F8]">
                            {isSelected ? (
                              <ChevronUp size={16} className="text-slate-600 shrink-0" />
                            ) : (
                              <ChevronDown size={16} className="text-slate-600 shrink-0" />
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Text Content */}
                      <p className={`text-[13px] sm:text-[14px] leading-relaxed transition-colors font-semibold ${
                        isSelected ? "text-slate-900" : "text-slate-700 line-clamp-2"
                      }`}>
                        {q.text}
                      </p>

                      {/* Expanded Section inside selected card */}
                      {isSelected && (
                        <div className="mt-4 pt-4 border-t border-slate-100 space-y-4">
                          {/* Student Handwriting OCR */}
                          {answer ? (
                            <div className="space-y-1.5">
                              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider text-left">
                                Student Answer Transcript
                              </h4>
                              <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl font-medium text-slate-700 text-xs leading-relaxed italic relative">
                                "{answer.text}"
                                <div className="text-[8px] text-slate-400 text-right mt-1 font-semibold">
                                  OCR Confidence: {Math.round(answer.confidence * 100)}%
                                </div>
                              </div>

                              {/* Multimodal visual elements details */}
                              {answer.visualElements && answer.visualElements.length > 0 && (
                                <div className="space-y-1.5 mt-3">
                                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider text-left">
                                    Visual elements detected
                                  </h4>
                                  <div className="space-y-1">
                                    {answer.visualElements.map((vel) => (
                                      <div key={vel.id} className="p-2 bg-[#F3F4F6]/50 border border-slate-100 rounded-lg text-left">
                                        <div className="flex justify-between items-center text-[9px] font-bold mb-0.5">
                                          <span className="text-[#EA643A] uppercase">{vel.type}</span>
                                          <span className="text-slate-400">Page {vel.page}</span>
                                        </div>
                                        <p className="text-[10px] text-slate-650 leading-snug">
                                          {vel.description}
                                        </p>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="p-3 bg-[#FCECE8] rounded-xl text-left border border-[#FCECE8]/50 flex items-start gap-2">
                              <AlertTriangle className="h-4 w-4 text-[#EA643A] shrink-0 mt-0.5" />
                              <div>
                                <h4 className="text-xs font-bold text-[#EA643A]">No Student Answer Detected</h4>
                                <p className="text-[10px] text-[#ea643a]/80 leading-relaxed mt-0.5">
                                  The student skipped this question or writing could not be located.
                                </p>
                              </div>
                            </div>
                          )}

                          {/* AI Grading Verdict critique */}
                          {grade && (
                            <div className="border border-slate-100 rounded-xl overflow-hidden text-left bg-slate-50/50">
                              <div className="flex items-center justify-between px-3.5 py-2.5 bg-slate-100/50 border-b border-slate-100">
                                <div className="flex items-center gap-1.5 text-slate-700 text-xs font-bold">
                                  <Award className="h-4 w-4 text-[#EA643A]" />
                                  <span>AI Evaluator</span>
                                </div>
                                <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${getEvaluationStyles(grade.evaluation)}`}>
                                  {grade.evaluation}
                                </span>
                              </div>
                              <div className="p-3.5 space-y-3.5">
                                <div>
                                  <h5 className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                                    Critique & Feedback
                                  </h5>
                                  <p className="text-xs text-slate-600 leading-relaxed">
                                    {grade.feedback}
                                  </p>
                                </div>

                                <div className="space-y-2 pt-2.5 border-t border-slate-100">
                                  {grade.strengths && (
                                    <div className="text-left">
                                      <h6 className="text-[9px] font-bold text-emerald-700 uppercase flex items-center gap-1 mb-0.5">
                                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                                        Key Strengths
                                      </h6>
                                      <p className="text-[11px] text-slate-500 leading-normal pl-4.5">
                                        {grade.strengths}
                                      </p>
                                    </div>
                                  )}

                                  {grade.missingConcepts && (
                                    <div className="text-left">
                                      <h6 className="text-[9px] font-bold text-amber-700 uppercase flex items-center gap-1 mb-0.5">
                                        <Sparkles className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                                        Suggestions / Missing Context
                                      </h6>
                                      <p className="text-[11px] text-slate-500 leading-normal pl-4.5">
                                        {grade.missingConcepts}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Visual checklist icons preview row */}
                      {answer && !isSelected && (
                        <div className="flex flex-wrap gap-1.5 mt-2.5">
                          <span className="text-[8px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                            Text ✓
                          </span>
                          {hasEquation && (
                            <span className="text-[8px] font-bold text-blue-500 bg-blue-50/50 px-1.5 py-0.5 rounded">
                              Math ✓
                            </span>
                          )}
                          {requiresDiagram ? (
                            hasDiagram ? (
                              <span className="text-[8px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                                Diagram ✓
                              </span>
                            ) : (
                              <span className="text-[8px] font-bold text-[#EA643A] bg-[#FCECE8] px-1.5 py-0.5 rounded">
                                Diagram missing ⚠
                              </span>
                            )
                          ) : (
                            hasDiagram && (
                              <span className="text-[8px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                                Diagram ✓
                              </span>
                            )
                          )}
                          {hasTable && (
                            <span className="text-[8px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
                              Table ✓
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </>
        )}

        {/* Unmatched Student Handwriting answers list */}
        {(activeFilter === 'all' || activeFilter === 'unmatched') && unmatchedAnswers.length > 0 && (
          <div className="space-y-3 pt-2">
            {activeFilter === 'all' && (
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider text-left pl-2 mt-4 mb-2">
                Unmatched Writing transcript Blocks
              </div>
            )}
            {unmatchedAnswers.map((ans) => {
              const isSelected = selectedQuestionId === ans.id;
              return (
                <div
                  key={ans.id}
                  onClick={() => onSelectQuestion(ans.id, ans.id, true)}
                  className={`p-4 rounded-xl border border-dashed cursor-pointer transition-all duration-200 hover:scale-[1.01] hover:shadow-sm ${
                    isSelected
                      ? 'border-purple-600 bg-purple-50 shadow-md ring-1 ring-purple-500'
                      : 'border-purple-200 bg-purple-50/20 hover:border-purple-300'
                  }`}
                >
                  <div className="flex justify-between items-start gap-2 mb-2">
                    <span className="text-[10px] font-extrabold text-purple-750 bg-purple-100 px-2.5 py-0.5 rounded-full">
                      {ans.rawQuestionReference || 'Unlabeled'}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[9px] font-bold text-purple-650 bg-purple-100 px-2 py-0.5 rounded-full">
                      Unmatched
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-purple-950 line-clamp-2 leading-relaxed italic text-left">
                    "{ans.text}"
                  </p>

                  <div className="flex flex-wrap gap-1.5 mt-2.5">
                    <span className="text-[8px] font-bold text-purple-700 bg-purple-100/50 px-1.5 py-0.5 rounded">
                      Text ✓
                    </span>
                    {ans.hasDiagram && (
                      <span className="text-[8px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                        Diagram ✓
                      </span>
                    )}
                    {ans.hasEquation && (
                      <span className="text-[8px] font-bold text-blue-500 bg-blue-50/50 px-1.5 py-0.5 rounded">
                        Math ✓
                      </span>
                    )}
                  </div>
                  <p className="text-[9px] text-purple-400 font-semibold text-left mt-2">
                    Found on page {ans.regions[0]?.page}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

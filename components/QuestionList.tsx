/* eslint-disable react/no-unescaped-entities */
import React, { useState } from 'react';
import { Check, X, AlertTriangle, Search } from 'lucide-react';
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

  // Calculate quick metrics
  const totalQuestions = questions.length;
  const answeredCount = mappings.filter((m) => m.status === 'matched').length;
  const unansweredCount = mappings.filter((m) => m.status === 'unanswered').length;
  const reviewCount = mappings.filter((m) => m.status === 'ambiguous').length;

  const answeredQuestions = mappings.filter(
    (m) => m.status === 'matched' || m.status === 'ambiguous'
  ).length;

  // Calculate total score dynamically across all questions
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
    if (mapping?.status === 'unanswered') return sum + 5; // unanswered default max score
    const maxScoreVal = grade ? Number(grade.maxScore) : 5;
    return sum + (isNaN(maxScoreVal) ? 5 : maxScoreVal);
  }, 0);

  const percentage = totalPossible > 0 ? (totalObtained / totalPossible) * 100 : 0;

  // Answered questions with valid grading results
  const evaluatedQuestions = questions.filter((q) => {
    const mapping = getQuestionMapping(q.id);
    if (mapping?.status === 'unanswered') return false;
    const grade = getQuestionGrading(q.id);
    return !!grade && typeof grade.score === 'number' && !isNaN(grade.score);
  }).length;

  // Evaluation is complete if all answered questions have been evaluated and backend completed
  const evaluationComplete = (evaluatedQuestions === answeredQuestions) && (gradingStatus === 'completed');

  const formattedPercentage = percentage % 1 === 0 ? percentage.toFixed(0) : percentage.toFixed(1);

  return (
    <div className="flex flex-col h-full bg-slate-900 border-r border-slate-800 text-white select-none">
      {/* Search & Filter Header */}
      <div className="p-4 border-b border-slate-800 space-y-3 bg-slate-950/40">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search questions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 pl-9 pr-4 py-2 rounded-lg text-xs font-medium text-slate-200 placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-all"
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
              className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition-all ${
                activeFilter === filter.id
                  ? 'bg-violet-600 text-white shadow-sm'
                  : 'bg-slate-850 text-slate-400 hover:text-slate-250 hover:bg-slate-800'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* Metrics Quick Strip */}
      <div className="grid grid-cols-4 divide-x divide-slate-800 border-b border-slate-800 bg-slate-950/20 text-center py-2.5 text-[10px] font-extrabold text-slate-400">
        <div>
          <span className="block text-xs text-slate-200">{totalQuestions}</span>
          Total Items
        </div>
        <div>
          <span className="block text-xs text-emerald-400">{answeredCount}</span>
          Answered
        </div>
        <div>
          <span className="block text-xs text-red-400">{unansweredCount}</span>
          Unanswered
        </div>
        <div>
          <span className="block text-xs text-violet-400">
            {totalObtained} / {totalPossible}
          </span>
          Total Score
        </div>
      </div>

      {/* Prominent Overall Score Card */}
      {activeFilter !== 'unmatched' && (
        <div className="mx-4 mt-4 p-4 bg-slate-900/60 border border-slate-800 rounded-xl text-center space-y-2.5 relative overflow-hidden shadow-md flex-shrink-0">
          {/* Subtle background glow */}
          <div className="absolute inset-0 bg-gradient-to-br from-violet-600/5 to-transparent pointer-events-none" />
          
          <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
            Overall Assessment Score
          </div>
          
          <div className="flex flex-col items-center justify-center space-y-1">
            <span className="text-3xl font-extrabold text-white tracking-tight">
              {totalObtained} <span className="text-slate-500 text-xl font-medium">/</span> {totalPossible}
            </span>
            <span className="text-xs font-extrabold text-violet-400 px-2.5 py-0.5 bg-violet-950/50 rounded-full border border-violet-900/40">
              {formattedPercentage}%
            </span>
          </div>

          <div className="text-[10px] font-semibold text-slate-400 flex items-center justify-center gap-1.5 pt-2 border-t border-slate-800">
            <span className={`inline-block h-1.5 w-1.5 rounded-full ${evaluationComplete ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
            <span>
              {evaluationComplete ? 'Final Score' : 'Evaluation Incomplete'}
            </span>
            <span className="text-slate-500 font-bold">•</span>
            <span>
              {evaluationComplete
                ? `Evaluation Complete · ${evaluatedQuestions} of ${totalQuestions} evaluated`
                : `Evaluation Incomplete · ${evaluatedQuestions} of ${answeredQuestions} evaluated`}
            </span>
          </div>
        </div>
      )}

      {/* Questions Scrollable List */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 pt-2 space-y-3 no-scrollbar">
        {activeFilter !== 'unmatched' && (
          <>
            {filteredQuestions.length === 0 ? (
              <div className="text-center py-8 text-xs font-semibold text-slate-500">
                No matching questions found.
              </div>
            ) : (
              filteredQuestions.map((q) => {
                const mapping = getQuestionMapping(q.id);
                const grade = getQuestionGrading(q.id);
                const isSelected = selectedQuestionId === q.id;

                // Find mapped answer details to fetch visual flags
                const answer = mapping?.answerId ? answers.find((a) => a.id === mapping.answerId) : null;
                const requiresDiagram =
                  q.text.toLowerCase().includes('diagram') ||
                  q.text.toLowerCase().includes('draw') ||
                  q.text.toLowerCase().includes('illustration') ||
                  q.text.toLowerCase().includes('sketch');

                const hasDiagram = answer ? (answer.hasDiagram || answer.hasDrawing) : false;
                const hasEquation = answer ? answer.hasEquation : false;
                const hasTable = answer ? answer.hasTable : false;

                let statusBadge = null;
                if (mapping?.status === 'matched') {
                  statusBadge = (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-900/60">
                      <Check className="h-3 w-3" /> Answered
                    </span>
                  );
                } else if (mapping?.status === 'unanswered') {
                  statusBadge = (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-400 bg-red-950/60 px-2 py-0.5 rounded-full border border-red-900/60">
                      <X className="h-3 w-3" /> Unanswered
                    </span>
                  );
                } else if (mapping?.status === 'ambiguous') {
                  statusBadge = (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded-full border border-amber-900/60">
                      <AlertTriangle className="h-3 w-3" /> Needs Review
                    </span>
                  );
                }

                return (
                  <div
                    key={q.id}
                    onClick={() => onSelectQuestion(q.id, mapping?.answerId || null)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all duration-200 hover:scale-[1.01] hover:shadow-sm ${
                      isSelected
                        ? 'border-violet-600 bg-violet-950/30 ring-1 ring-violet-600'
                        : 'border-slate-800 bg-slate-900 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-2 mb-2">
                      <span className="text-xs font-extrabold text-slate-350 bg-slate-800 px-2.5 py-0.5 rounded-md">
                        Q{q.number}
                      </span>
                      <div className="flex items-center gap-2">
                        {grade && (
                          <span className="text-xs font-bold text-slate-300">
                            {grade.score}/{grade.maxScore} pts
                          </span>
                        )}
                        {statusBadge}
                      </div>
                    </div>
                    <p className="text-xs font-semibold text-slate-300 line-clamp-2 leading-relaxed">
                      {q.text}
                    </p>

                    {/* Multimodal visual checklist indicators */}
                    {answer && (
                      <div className="flex flex-wrap gap-1.5 mt-3 pt-2.5 border-t border-slate-800">
                        <span className="text-[9px] font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                          Text ✓
                        </span>
                        {hasEquation && (
                          <span className="text-[9px] font-bold text-blue-400 bg-blue-950/50 border border-blue-900/40 px-2 py-0.5 rounded">
                            Equation ✓
                          </span>
                        )}
                        {requiresDiagram ? (
                          hasDiagram ? (
                            <span className="text-[9px] font-bold text-emerald-400 bg-emerald-950/50 border border-emerald-900/40 px-2 py-0.5 rounded">
                              Diagram ✓
                            </span>
                          ) : (
                            <span className="text-[9px] font-bold text-red-400 bg-red-950/50 border border-red-900/40 px-2 py-0.5 rounded animate-pulse">
                              Diagram missing ⚠
                            </span>
                          )
                        ) : (
                          hasDiagram && (
                            <span className="text-[9px] font-bold text-emerald-400 bg-emerald-950/50 border border-emerald-900/40 px-2 py-0.5 rounded">
                              Diagram ✓
                            </span>
                          )
                        )}
                        {hasTable && (
                          <span className="text-[9px] font-bold text-amber-400 bg-amber-950/50 border border-amber-900/40 px-2 py-0.5 rounded">
                            Table ✓
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </>
        )}

        {/* Render Unmatched Answers if matching or in filter */}
        {(activeFilter === 'all' || activeFilter === 'unmatched') && unmatchedAnswers.length > 0 && (
          <div className="space-y-3 pt-2">
            {activeFilter === 'all' && (
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-4 mb-2">
                Unmatched Student Answers
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
                      ? 'border-purple-600 bg-purple-950/30 ring-1 ring-purple-600'
                      : 'border-purple-900/40 bg-purple-950/10 hover:border-purple-700/60'
                  }`}
                >
                  <div className="flex justify-between items-start gap-2 mb-2">
                    <span className="text-xs font-extrabold text-purple-300 bg-purple-900/50 px-2.5 py-0.5 rounded-md">
                      {ans.rawQuestionReference || 'Unlabeled'}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-purple-400 bg-purple-950/60 px-2 py-0.5 rounded-full border border-purple-900/60">
                      Unmatched
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-purple-200 line-clamp-2 leading-relaxed italic">
                    "{ans.text}"
                  </p>

                  {/* Render Visual indicators for unmatched responses */}
                  <div className="flex flex-wrap gap-1.5 mt-3 pt-2.5 border-t border-purple-950/50">
                    <span className="text-[9px] font-bold text-purple-300 bg-purple-900/40 px-2 py-0.5 rounded">
                      Text ✓
                    </span>
                    {ans.hasDiagram && (
                      <span className="text-[9px] font-bold text-emerald-400 bg-emerald-950/50 border border-emerald-900/40 px-2 py-0.5 rounded">
                        Diagram ✓
                      </span>
                    )}
                    {ans.hasEquation && (
                      <span className="text-[9px] font-bold text-blue-400 bg-blue-950/50 border border-blue-900/40 px-2 py-0.5 rounded">
                        Equation ✓
                      </span>
                    )}
                  </div>

                  <p className="text-[10px] text-purple-400/80 mt-2">
                    Found on Page {ans.regions[0]?.page}
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

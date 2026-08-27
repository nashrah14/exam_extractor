import React from 'react';
import { Loader2, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { ProcessingStatus, ProcessingStage } from '@/lib/types';

interface ProcessingProgressProps {
  status: ProcessingStatus;
  onRetry?: () => void;
  onCancel?: () => void;
}

export const ProcessingProgress: React.FC<ProcessingProgressProps> = ({
  status,
  onRetry,
  onCancel,
}) => {
  const { stage, progress, message, error } = status;

  // Pipeline stages configuration
  const stages: { key: ProcessingStage; label: string; desc: string }[] = [
    {
      key: 'rendering_pdf',
      label: 'Document Rendering',
      desc: 'Loading PDFs and converting pages to optimized images client-side.',
    },
    {
      key: 'extracting_questions',
      label: 'Question Paper Extraction',
      desc: 'OCR analyzing the question paper layout to extract questions and labels.',
    },
    {
      key: 'extracting_answers',
      label: 'Handwritten Answer Extraction',
      desc: 'Processing student handwriting pages and locating bounding boxes.',
    },
    {
      key: 'mapping_answers',
      label: 'Question-Answer Mapping',
      desc: 'Correlating extracted answers to the correct questions using AI logic.',
    },
    {
      key: 'grading',
      label: 'AI Grading & Evaluation',
      desc: 'Evaluating student answer completeness, scoring, and writing feedback.',
    },
  ];

  // Helper to get status of a stage
  const getStageStatus = (itemStage: ProcessingStage) => {
    const stageOrder: ProcessingStage[] = [
      'rendering_pdf',
      'extracting_questions',
      'extracting_answers',
      'mapping_answers',
      'grading',
      'completed',
    ];

    const currentIdx = stageOrder.indexOf(stage);
    const itemIdx = stageOrder.indexOf(itemStage);

    if (error && stage === itemStage) {
      return 'error';
    }
    if (currentIdx > itemIdx) {
      return 'completed';
    }
    if (currentIdx === itemIdx) {
      return 'active';
    }
    return 'pending';
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] py-12 px-4 max-w-2xl mx-auto">
      <div className="w-full bg-white border border-slate-200 rounded-2xl shadow-sm p-8 md:p-10">
        <h2 className="text-2xl font-bold text-slate-900 text-center mb-2">
          {error ? 'Analysis Stopped' : 'Analyzing Assessment'}
        </h2>
        <p className="text-slate-500 text-sm text-center mb-8">
          {error ? 'An error occurred during processing. Please review details below.' : 'Please wait while VedaAI extracts and maps the assessment.'}
        </p>

        {/* Progress Bar */}
        {!error && (
          <div className="mb-10">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-semibold text-violet-600 bg-violet-50 px-2.5 py-1 rounded-full border border-violet-100">
                Stage: {stages.find(s => s.key === stage)?.label || 'Processing'}
              </span>
              <span className="text-sm font-bold text-slate-700">{progress}%</span>
            </div>
            <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-violet-600 transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <p className="text-xs text-slate-400 mt-2 text-center italic">
              {message}
            </p>
          </div>
        )}

        {/* Error Dialog Banner */}
        {error && (
          <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-5 mb-8">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-sm font-bold text-red-800 mb-1">Processing Error</h4>
              <p className="text-xs text-red-700 leading-relaxed mb-4">{error}</p>
              <div className="flex gap-3">
                {onRetry && (
                  <button
                    onClick={onRetry}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
                  >
                    <RefreshCw className="h-3 w-3" /> Retry Extraction
                  </button>
                )}
                {onCancel && (
                  <button
                    onClick={onCancel}
                    className="px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 rounded-lg text-xs font-semibold shadow-sm transition-colors"
                  >
                    Go Back
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Stage List Checklist */}
        <div className="space-y-4">
          {stages.map((s, index) => {
            const itemStatus = getStageStatus(s.key);
            return (
              <div
                key={s.key}
                className={`flex gap-4 p-4 rounded-xl border transition-all duration-200 ${
                  itemStatus === 'active'
                    ? 'border-violet-200 bg-violet-50/20'
                    : itemStatus === 'completed'
                    ? 'border-slate-100 bg-slate-50/20 opacity-75'
                    : itemStatus === 'error'
                    ? 'border-red-200 bg-red-50/20'
                    : 'border-slate-100 opacity-50'
                }`}
              >
                <div className="flex-shrink-0 mt-0.5">
                  {itemStatus === 'active' && (
                    <Loader2 className="h-5 w-5 text-violet-600 animate-spin" />
                  )}
                  {itemStatus === 'completed' && (
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  )}
                  {itemStatus === 'error' && (
                    <AlertCircle className="h-5 w-5 text-red-500" />
                  )}
                  {itemStatus === 'pending' && (
                    <div className="h-5 w-5 border-2 border-slate-300 rounded-full flex items-center justify-center text-xs font-medium text-slate-400">
                      {index + 1}
                    </div>
                  )}
                </div>
                <div>
                  <h3
                    className={`text-sm font-bold leading-none mb-1.5 ${
                      itemStatus === 'active'
                        ? 'text-violet-900'
                        : itemStatus === 'completed'
                        ? 'text-slate-700'
                        : itemStatus === 'error'
                        ? 'text-red-900'
                        : 'text-slate-400'
                    }`}
                  >
                    {s.label}
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {s.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

'use client';

import React, { useRef } from 'react';
import { Upload, X, ArrowRight } from 'lucide-react';

interface UploadPanelProps {
  onAnalyze: (qpFile: File, asFile: File) => void;
  onLaunchDemo: () => void;
}

export const UploadPanel: React.FC<UploadPanelProps> = ({ onAnalyze, onLaunchDemo }) => {
  const [questionPaper, setQuestionPaper] = React.useState<File | null>(null);
  const [answerSheet, setAnswerSheet] = React.useState<File | null>(null);

  const qpInputRef = useRef<HTMLInputElement>(null);
  const asInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (questionPaper && answerSheet) {
      onAnalyze(questionPaper, answerSheet);
    }
  };

  const canStart = questionPaper && answerSheet;

  const renderFilePicker = (
    id: string,
    titlePrefix: string,
    highlightText: string,
    file: File | null,
    setFile: (f: File | null) => void,
    inputRef: React.RefObject<HTMLInputElement | null>
  ) => {
    if (file) {
      return (
        <div className="flex h-full w-full items-center justify-center bg-white p-2">
          <div className="relative flex items-center gap-[12px] rounded-[10px] p-2">
            {/* Remove File Button */}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                setFile(null);
                if (inputRef.current) inputRef.current.value = '';
              }}
              className="absolute -right-3 -top-3 z-10 flex h-[22px] w-[22px] items-center justify-center rounded-full bg-[#5E5E5E] text-white hover:bg-[#404040] transition-colors"
              title="Remove file"
            >
              <X size={12} strokeWidth={3} />
            </button>

            {/* PDF Badge Icon */}
            <div className="flex h-[36px] w-[36px] shrink-0 items-center justify-center rounded-[8px] bg-[#EB5757] text-[10px] font-bold text-white shadow-sm">
              PDF
            </div>
            <div className="flex flex-col justify-center text-left">
              <span className="text-[13px] font-bold text-[#171717] truncate max-w-[135px] sm:max-w-[200px] leading-tight">
                {file.name}
              </span>
              <span className="text-[11px] font-medium text-[#9CA3AF] mt-[4px] leading-tight">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </span>
            </div>
          </div>
        </div>
      );
    }

    return (
      <label 
        htmlFor={id} 
        className="flex h-full w-full cursor-pointer flex-col items-center justify-center bg-white hover:bg-slate-50 transition-colors"
      >
        <div className="mb-[10px] flex h-[34px] w-[34px] items-center justify-center rounded-[7px] bg-[#F5F5F5] text-[#858585]">
          <Upload size={18} />
        </div>
        
        <span className="mb-[4px] text-[15px] font-semibold text-[#171717]">
          {titlePrefix} <span className="text-[#f05f37]">{highlightText}</span>
        </span>
        
        <span className="text-[12px] text-[#9CA3AF]">
          Max 15MB
        </span>
        
        <input 
          id={id} 
          ref={inputRef as any}
          className="sr-only" 
          type="file" 
          accept=".pdf,.png,.jpg,.jpeg,.webp,application/pdf,image/png,image/jpeg,image/webp" 
          onChange={(event) => setFile(event.target.files?.[0] || null)} 
        />
      </label>
    );
  };

  return (
    <section className="mx-auto flex h-full w-full flex-col items-center px-4 pt-1 sm:pt-8 bg-transparent max-w-3xl">
      {/* Header Title */}
      <div className="w-full text-center mt-6">
        {/* Desktop Heading */}
        <h2 className="hidden sm:flex items-center justify-center text-[34px] font-bold leading-none tracking-[-1.5px]">
          <span className="text-[#272727]">Upload</span>
          <span className="ml-1.5 rounded-[7px] bg-[#f9e4da] px-[10px] py-[7px] text-[#f05f37]">
            Question Paper &amp; Answer Sheets
          </span>
        </h2>

        {/* Mobile Heading */}
        <h2 className="sm:hidden text-center text-[22px] font-bold leading-tight tracking-tight text-[#272727]">
          Upload Question Paper<br />
          &amp; Answer Sheets
        </h2>

        <p className="mt-[6px] sm:mt-[9px] text-[15px] sm:text-[17px] font-normal leading-[22px] text-[#303030]">
          Upload both files to get started
        </p>
      </div>

      {/* Rotating Teacher Avatar Graphic */}
      <div className="relative mt-[16px] sm:mt-[24px] h-[100px] w-[100px] sm:h-[130px] sm:w-[130px] shrink-0">
        {/* Teacher Avatar */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/assets/teacherlogo.png"
          alt="Teacher"
          className="absolute left-1/2 top-1/2 z-10 h-[80px] w-[80px] sm:h-[110px] sm:w-[110px] -translate-x-1/2 -translate-y-1/2 rounded-full object-cover"
        />

        {/* Spinning Outer Icons */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/assets/iconsaroundteacherlogo.png"
          alt=""
          aria-hidden="true"
          className="absolute left-1/2 top-1/2 z-20 h-[80px] w-[80px] sm:h-[110px] sm:w-[110px] -translate-x-1/2 -translate-y-1/2 object-contain opacity-90 animate-[spin_30s_linear_infinite]"
        />
      </div>

      {/* Upload Form Box */}
      <form
        onSubmit={handleSubmit}
        className="mt-[16px] sm:mt-[18px] w-full max-w-[716px]"
      >
        {/* Gray Container containing the Pickers */}
        <div className="flex flex-col sm:grid sm:h-[181px] sm:grid-cols-2 gap-[8px] sm:gap-[14px] rounded-[20px] bg-[#eeeeee] p-[8px] sm:p-[10px]">
          {/* Question Paper Dropzone */}
          <div className="h-[110px] sm:h-[159px] overflow-hidden rounded-[16px] border-2 border-dashed border-[#d8d8d8] bg-white">
            {renderFilePicker("question-paper", "Upload", "Question Paper", questionPaper, setQuestionPaper, qpInputRef)}
          </div>

          {/* Answer Sheet Dropzone */}
          <div className="h-[110px] sm:h-[159px] overflow-hidden rounded-[16px] border-2 border-dashed border-[#d8d8d8] bg-white">
            {renderFilePicker("answer-sheet", "Upload", "Answer Sheet", answerSheet, setAnswerSheet, asInputRef)}
          </div>
        </div>

        {/* Buttons / Actions */}
        <div className="mt-[24px] sm:mt-[32px] flex flex-col items-center gap-4">
          <button
            type="submit"
            disabled={!canStart}
            className={`inline-flex h-[36px] w-[152px] items-center justify-center gap-2 rounded-full px-[15px] text-[13px] font-semibold leading-none transition-colors disabled:cursor-not-allowed ${
              canStart
                ? "bg-[#EA643A] text-white hover:bg-[#d55229]"
                : "bg-gray-400 text-gray-200"
            }`}
          >
            <span>Start Mapping</span>
            <ArrowRight size={16} strokeWidth={2.5} />
          </button>

          <button
            type="button"
            onClick={onLaunchDemo}
            className="text-[12px] font-bold text-slate-500 hover:text-[#f05f37] underline transition-colors cursor-pointer"
          >
            Or play with Demo Mode
          </button>

          <p className="max-w-[420px] text-center text-[12px] font-normal leading-[17px] text-gray-500 mt-2">
            Once both files are uploaded, you'll be able to map
            answers with questions automatically.
          </p>
        </div>
      </form>
    </section>
  );
};

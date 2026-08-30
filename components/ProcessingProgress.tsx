'use client';

import React from 'react';
import { AlertCircle, RefreshCw, Loader2 } from 'lucide-react';
import { ProcessingStatus } from '@/lib/types';

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
  const { progress, message, error } = status;

  return (
    <section 
      className="flex h-full w-full flex-col items-center justify-center bg-white px-4 sm:bg-transparent min-h-[60vh] max-w-xl mx-auto mt-12" 
      aria-live="polite"
    >
      <div className="flex flex-col items-center text-center w-full">
        {/* Pulsing Loading Graphic */}
        {!error && (
          <div className="relative mb-[24px] h-[100px] w-[100px] sm:h-[120px] sm:w-[120px] animate-pulse">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src="/assets/loading.png" 
              alt="Loading..." 
              className="h-full w-full object-contain"
            />
          </div>
        )}

        {/* Header Text */}
        <h2 className="text-[28px] sm:text-[34px] font-bold leading-none tracking-[-1.5px] text-[#272727]">
          {error ? 'Extraction Stopped' : 'Extracting...'}
        </h2>
        <p className="mt-[8px] text-[15px] sm:text-[17px] font-normal leading-[22px] text-[#9CA3AF] max-w-md">
          {error ? 'An error occurred during OCR mapping.' : 'This may take a while.'}
        </p>

        {/* Message and Progress */}
        {!error && (
          <div className="w-full mt-8 bg-white border border-slate-200 shadow-sm rounded-2xl p-6 text-left">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Progress Status
              </span>
              <span className="text-sm font-bold text-slate-800">{progress}%</span>
            </div>
            
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mb-3">
              <div 
                className="h-full bg-[#EA643A] transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              ></div>
            </div>

            <p className="text-xs text-slate-400 italic text-center mt-1 flex items-center justify-center gap-1.5">
              <Loader2 size={12} className="animate-spin text-[#EA643A]" />
              {message}
            </p>
          </div>
        )}

        {/* Error Details */}
        {error && (
          <div className="w-full mt-6 bg-red-50 border border-red-200 rounded-2xl p-6 text-left">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-red-800">Processing Error</h4>
                <p className="text-xs text-red-700 leading-relaxed mt-1">{error}</p>
                
                <div className="flex gap-3 mt-4">
                  {onRetry && (
                    <button
                      onClick={onRetry}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#EA643A] hover:bg-[#d55229] text-white rounded-full text-xs font-bold shadow-sm transition-colors cursor-pointer"
                    >
                      <RefreshCw className="h-3.5 w-3.5" /> Retry Mapping
                    </button>
                  )}
                  {onCancel && (
                    <button
                      onClick={onCancel}
                      className="px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-650 rounded-full text-xs font-bold shadow-sm transition-colors cursor-pointer"
                    >
                      Go Back
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

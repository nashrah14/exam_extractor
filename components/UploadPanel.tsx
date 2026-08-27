/* eslint-disable @typescript-eslint/no-explicit-any, react/no-unescaped-entities */
import React, { useRef, useState } from 'react';
import { Upload, FileText, Trash2, FileImage, Sparkles, CheckCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils/coordinates';


export interface UploadedFileInfo {
  file: File;
  name: string;
  size: string;
  type: string;
  pageCount: number | null;
  previewUrl?: string;
}

interface UploadPanelProps {
  onAnalyze: (qpFile: File, asFile: File) => void;
  onLaunchDemo: () => void;
}

export const UploadPanel: React.FC<UploadPanelProps> = ({ onAnalyze, onLaunchDemo }) => {
  const [qpFile, setQpFile] = useState<UploadedFileInfo | null>(null);
  const [asFile, setAsFile] = useState<UploadedFileInfo | null>(null);
  const [qpError, setQpError] = useState<string | null>(null);
  const [asError, setAsError] = useState<string | null>(null);
  const [isQpDragging, setIsQpDragging] = useState(false);
  const [isAsDragging, setIsAsDragging] = useState(false);

  const qpInputRef = useRef<HTMLInputElement>(null);
  const asInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const validateFile = (file: File, type: 'qp' | 'as') => {
    const errorSetter = type === 'qp' ? setQpError : setAsError;
    const fileSetter = type === 'qp' ? setQpFile : setAsFile;
    errorSetter(null);

    // Limit to 15MB
    const maxSize = 15 * 1024 * 1024;
    if (file.size > maxSize) {
      errorSetter('File is too large. Maximum allowed size is 15MB.');
      return;
    }

    const validTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      errorSetter('Invalid file type. Only PDF and PNG/JPEG/WebP images are supported.');
      return;
    }

    // Rough page detection: if it's an image, it's 1 page. If PDF, we will extract actual count in page.tsx
    fileSetter({
      file,
      name: file.name,
      size: formatFileSize(file.size),
      type: file.type === 'application/pdf' ? 'PDF Document' : 'Image',
      pageCount: file.type === 'application/pdf' ? null : 1, // Will be updated for PDF dynamically
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'qp' | 'as') => {
    if (e.target.files && e.target.files[0]) {
      validateFile(e.target.files[0], type);
    }
  };

  const handleDragOver = (e: React.DragEvent, type: 'qp' | 'as') => {
    e.preventDefault();
    if (type === 'qp') setIsQpDragging(true);
    else setIsAsDragging(true);
  };

  const handleDragLeave = (type: 'qp' | 'as') => {
    if (type === 'qp') setIsQpDragging(false);
    else setIsAsDragging(false);
  };

  const handleDrop = (e: React.DragEvent, type: 'qp' | 'as') => {
    e.preventDefault();
    if (type === 'qp') {
      setIsQpDragging(false);
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        validateFile(e.dataTransfer.files[0], 'qp');
      }
    } else {
      setIsAsDragging(false);
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        validateFile(e.dataTransfer.files[0], 'as');
      }
    }
  };

  const removeFile = (type: 'qp' | 'as') => {
    if (type === 'qp') {
      setQpFile(null);
      setQpError(null);
      if (qpInputRef.current) qpInputRef.current.value = '';
    } else {
      setAsFile(null);
      setAsError(null);
      if (asInputRef.current) asInputRef.current.value = '';
    }
  };

  const triggerAnalyze = () => {
    if (qpFile && asFile) {
      onAnalyze(qpFile.file, asFile.file);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] py-12 px-4 max-w-5xl mx-auto">
      {/* Figma design: Card container */}
      <div className="w-full bg-white border border-slate-200 rounded-2xl shadow-sm p-8 md:p-12">
        <div className="text-center max-w-xl mx-auto mb-10">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-violet-50 text-violet-700 mb-4 border border-violet-100">
            <Sparkles className="h-3 w-3" /> Teacher Assessment Dashboard
          </span>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-3">
            Upload Question Paper & Answer Sheet
          </h1>
          <p className="text-slate-500 text-sm leading-relaxed">
            Upload a printed exam question paper and a student's handwritten answer sheet. 
            The AI will extract, map, and highlight matching regions.
          </p>
        </div>

        {/* Dual drag-and-drop boxes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
          {/* Question Paper Upload Box */}
          <div className="flex flex-col">
            <label className="text-sm font-semibold text-slate-700 mb-2.5 flex items-center gap-1.5">
              <span>1. Question Paper</span>
              <span className="text-xs font-normal text-slate-400">(PDF or Images)</span>
            </label>

            {!qpFile ? (
              <div
                onDragOver={(e) => handleDragOver(e, 'qp')}
                onDragLeave={() => handleDragLeave('qp')}
                onDrop={(e) => handleDrop(e, 'qp')}
                onClick={() => qpInputRef.current?.click()}
                className={cn(
                  'flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 h-64',
                  isQpDragging
                    ? 'border-violet-500 bg-violet-50/50 scale-[1.01]'
                    : 'border-slate-300 hover:border-violet-400 hover:bg-slate-50/50'
                )}
              >
                <input
                  type="file"
                  ref={qpInputRef}
                  onChange={(e) => handleFileChange(e, 'qp')}
                  accept=".pdf,image/png,image/jpeg,image/jpg,image/webp"
                  className="hidden"
                />
                <div className="p-4 bg-slate-100 rounded-full text-slate-600 mb-4 group-hover:scale-110 transition-transform">
                  <Upload className="h-6 w-6" />
                </div>
                <p className="text-sm font-semibold text-slate-700 mb-1">
                  Drag & drop file here
                </p>
                <p className="text-xs text-slate-400 mb-3">or browse from your system</p>
                <p className="text-[11px] text-slate-400 max-w-[200px]">
                  PDF, PNG, JPG, JPEG, or WebP (max 15MB)
                </p>
              </div>
            ) : (
              <div className="flex flex-col justify-between border border-slate-200 rounded-xl p-6 bg-slate-50/50 h-64">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-violet-100 text-violet-700 rounded-lg">
                    {qpFile.type === 'PDF Document' ? (
                      <FileText className="h-6 w-6" />
                    ) : (
                      <FileImage className="h-6 w-6" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate mb-0.5">
                      {qpFile.name}
                    </p>
                    <p className="text-xs text-slate-400 mb-1">{qpFile.size}</p>
                    <div className="flex items-center gap-1.5 text-xs text-violet-600 font-medium">
                      <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                      <span>Ready to extract</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between border-t border-slate-100 pt-4 mt-auto">
                  <span className="text-xs text-slate-500 font-medium">
                    Type: <span className="text-slate-700">{qpFile.type}</span>
                  </span>
                  <button
                    onClick={() => removeFile('qp')}
                    className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="Remove file"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
            
            {qpError && (
              <div className="flex items-center gap-1.5 mt-2 text-xs text-red-500">
                <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
                <span>{qpError}</span>
              </div>
            )}
          </div>

          {/* Student Answer Sheet Upload Box */}
          <div className="flex flex-col">
            <label className="text-sm font-semibold text-slate-700 mb-2.5 flex items-center gap-1.5">
              <span>2. Student Answer Sheet</span>
              <span className="text-xs font-normal text-slate-400">(Handwritten PDF/Images)</span>
            </label>

            {!asFile ? (
              <div
                onDragOver={(e) => handleDragOver(e, 'as')}
                onDragLeave={() => handleDragLeave('as')}
                onDrop={(e) => handleDrop(e, 'as')}
                onClick={() => asInputRef.current?.click()}
                className={cn(
                  'flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 h-64',
                  isAsDragging
                    ? 'border-violet-500 bg-violet-50/50 scale-[1.01]'
                    : 'border-slate-300 hover:border-violet-400 hover:bg-slate-50/50'
                )}
              >
                <input
                  type="file"
                  ref={asInputRef}
                  onChange={(e) => handleFileChange(e, 'as')}
                  accept=".pdf,image/png,image/jpeg,image/jpg,image/webp"
                  className="hidden"
                />
                <div className="p-4 bg-slate-100 rounded-full text-slate-600 mb-4 group-hover:scale-110 transition-transform">
                  <Upload className="h-6 w-6" />
                </div>
                <p className="text-sm font-semibold text-slate-700 mb-1">
                  Drag & drop file here
                </p>
                <p className="text-xs text-slate-400 mb-3">or browse from your system</p>
                <p className="text-[11px] text-slate-400 max-w-[200px]">
                  PDF, PNG, JPG, JPEG, or WebP (max 15MB)
                </p>
              </div>
            ) : (
              <div className="flex flex-col justify-between border border-slate-200 rounded-xl p-6 bg-slate-50/50 h-64">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-violet-100 text-violet-700 rounded-lg">
                    {asFile.type === 'PDF Document' ? (
                      <FileText className="h-6 w-6" />
                    ) : (
                      <FileImage className="h-6 w-6" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate mb-0.5">
                      {asFile.name}
                    </p>
                    <p className="text-xs text-slate-400 mb-1">{asFile.size}</p>
                    <div className="flex items-center gap-1.5 text-xs text-violet-600 font-medium">
                      <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                      <span>Ready to extract</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between border-t border-slate-100 pt-4 mt-auto">
                  <span className="text-xs text-slate-500 font-medium">
                    Type: <span className="text-slate-700">{asFile.type}</span>
                  </span>
                  <button
                    onClick={() => removeFile('as')}
                    className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="Remove file"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {asError && (
              <div className="flex items-center gap-1.5 mt-2 text-xs text-red-500">
                <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
                <span>{asError}</span>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 border-t border-slate-100 pt-8">
          <button
            onClick={onLaunchDemo}
            className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 bg-white hover:bg-slate-50 hover:text-slate-800 active:bg-slate-100 transition-all shadow-sm"
          >
            Play with Demo Mode
          </button>
          
          <button
            onClick={triggerAnalyze}
            disabled={!qpFile || !asFile}
            className={cn(
              'w-full sm:w-auto inline-flex items-center justify-center px-8 py-3 rounded-xl text-sm font-bold text-white shadow-sm transition-all duration-200',
              qpFile && asFile
                ? 'bg-violet-600 hover:bg-violet-700 active:bg-violet-800 cursor-pointer'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            )}
          >
            Start Analyzing Documents
          </button>
        </div>
      </div>
    </div>
  );
};

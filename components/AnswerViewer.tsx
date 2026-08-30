'use client';

import React, { useRef, useEffect, useState, useMemo } from 'react';
import { Minus, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { AnswerRegion, Answer } from '@/lib/types';
import { mockAnswerSheetPages, MockPageData } from '@/lib/demo-data';

interface AnswerViewerProps {
  pages?: { pageNumber: number; dataUrl: string; width: number; height: number }[];
  activeRegions: AnswerRegion[];
  selectedLabel: string;
  isDemoMode?: boolean;
  selectedAnswer: Answer | null;
}

export const AnswerViewer: React.FC<AnswerViewerProps> = ({
  pages = [],
  activeRegions = [],
  selectedLabel,
  isDemoMode = false,
  selectedAnswer,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [zoomScale, setZoomScale] = useState(1.0);
  const [pageAspect, setPageAspect] = useState(1.29);

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Sync current page with first active region when activeRegions change
  useEffect(() => {
    if (activeRegions.length > 0) {
      setCurrentPage(activeRegions[0].page);
    }
  }, [activeRegions]);

  const totalPages = isDemoMode ? mockAnswerSheetPages.length : pages.length;
  const regionPages = useMemo(() => {
    const pNums = activeRegions.map((region) => region.page);
    return [...new Set(pNums)].sort((a, b) => a - b);
  }, [activeRegions]);

  // Ruled Notebook drawing utility for mock data
  const drawNotebookPage = (
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    pageNum: number,
    pageData?: MockPageData
  ) => {
    canvas.width = 850;
    canvas.height = 1100;

    // Draw page background
    ctx.fillStyle = '#fbfbf9';
    ctx.fillRect(0, 0, 850, 1100);

    // Draw vertical red line
    ctx.strokeStyle = '#fca5a5';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(80, 0);
    ctx.lineTo(80, 1100);
    ctx.stroke();

    // Draw horizontal ruled lines
    ctx.strokeStyle = '#bfdbfe';
    ctx.lineWidth = 1.0;
    const lineSpacing = 28;
    for (let y = 100; y < 1100; y += lineSpacing) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(850, y);
      ctx.stroke();
    }

    // Header info (Page index)
    ctx.fillStyle = '#64748b';
    ctx.font = 'bold 12px Courier New';
    ctx.fillText(`ANSWER SHEET - PAGE ${pageNum}/${totalPages}`, 610, 45);

    // Draw handwriting text
    if (pageData) {
      pageData.lines.forEach((line) => {
        if (line.isLabel) {
          ctx.fillStyle = '#dc2626';
          ctx.font = 'bold italic 17px "Courier New", Courier, monospace';
        } else if (line.isMath) {
          ctx.fillStyle = '#1e3a8a';
          ctx.font = 'bold italic 18px "Courier New", Courier, monospace';
        } else {
          ctx.fillStyle = '#1d4ed8';
          ctx.font = 'italic 16px "Courier New", Courier, monospace';
        }
        ctx.fillText(line.text, line.x, line.y);
      });

      // Draw custom visual diagrams inside demo pages
      if (pageNum === 1) {
        ctx.strokeStyle = '#059669';
        ctx.fillStyle = '#10b981';
        ctx.lineWidth = 2.5;

        // Draw Stem
        ctx.beginPath();
        ctx.moveTo(425, 300);
        ctx.quadraticCurveTo(420, 240, 425, 200);
        ctx.stroke();

        // Draw Leaves
        ctx.beginPath();
        ctx.ellipse(395, 250, 30, 12, Math.PI / 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.beginPath();
        ctx.ellipse(455, 230, 28, 10, -Math.PI / 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Draw Roots
        ctx.strokeStyle = '#b45309';
        ctx.lineWidth = 2.0;
        ctx.beginPath();
        ctx.moveTo(425, 300);
        ctx.lineTo(410, 340);
        ctx.moveTo(425, 300);
        ctx.lineTo(440, 335);
        ctx.moveTo(425, 300);
        ctx.lineTo(428, 350);
        ctx.stroke();

        // Labels
        ctx.fillStyle = '#b45309';
        ctx.font = 'bold italic 12px "Courier New"';
        ctx.fillText('Water (Roots)', 340, 345);

        ctx.fillStyle = '#eab308';
        ctx.font = 'bold italic 12px "Courier New"';
        ctx.fillText('Sunlight', 380, 160);

        ctx.fillStyle = '#374151';
        ctx.font = 'bold italic 12px "Courier New"';
        ctx.fillText('Carbon dioxide', 260, 240);

        ctx.fillStyle = '#059669';
        ctx.font = 'bold italic 12px "Courier New"';
        ctx.fillText('Oxygen', 485, 210);

        // Draw annotations boundary indicator
        ctx.strokeStyle = '#8b5cf6';
        ctx.lineWidth = 1.0;
        ctx.setLineDash([4, 4]);
        ctx.strokeRect(250, 130, 320, 230);
        ctx.setLineDash([]);
      }
    }
  };

  // Redraw canvas on page change
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (isDemoMode) {
      setPageAspect(1100 / 850);
      const pageData = mockAnswerSheetPages[currentPage - 1];
      drawNotebookPage(ctx, canvas, currentPage, pageData);
    } else {
      const page = pages.find((p) => p.pageNumber === currentPage);
      if (page) {
        setPageAspect(page.height / page.width);
        const img = new Image();
        img.onload = () => {
          canvas.width = page.width;
          canvas.height = page.height;
          ctx.drawImage(img, 0, 0, page.width, page.height);
        };
        img.src = page.dataUrl;
      } else {
        canvas.width = 650;
        canvas.height = 800;
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(0, 0, 650, 800);
        ctx.fillStyle = '#64748b';
        ctx.font = '14px Inter';
        ctx.fillText('No Answer Sheet Loaded', 240, 400);
      }
    }
  }, [currentPage, pages, isDemoMode, totalPages]);

  // Page dimension helpers
  const activePageWidth = isDemoMode ? 850 : (pages.find(p => p.pageNumber === currentPage)?.width || 650);
  const activePageHeight = isDemoMode ? 1100 : (pages.find(p => p.pageNumber === currentPage)?.height || 850);

  const currentRegions = activeRegions.filter(r => r.page === currentPage);

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col bg-[#DCE0E5]">
      {/* Dark Toolbar Header */}
      <div className="flex h-[60px] shrink-0 items-center justify-between bg-[#2B2B2B] px-4 sm:px-6">
        <div className="flex items-center gap-6">
          <h2 className="hidden sm:block text-[15px] font-bold text-white">Answer Sheet</h2>

          {/* Zoom Controls */}
          <div className="flex items-center rounded-xl bg-[#3D3D3D] px-2 py-1.5 text-white shadow-sm">
            <button 
              aria-label="Zoom out" 
              onClick={() => setZoomScale((value) => Math.max(0.4, value - 0.2))} 
              className="flex items-center justify-center p-1 hover:text-slate-350 transition-colors cursor-pointer"
            >
              <Minus size={15} strokeWidth={3} />
            </button>
            <span className="w-[42px] text-center text-[12px] font-bold">
              {Math.round(zoomScale * 100)}%
            </span>
            <button 
              aria-label="Zoom in" 
              onClick={() => setZoomScale((value) => Math.min(2.0, value + 0.2))} 
              className="flex items-center justify-center p-1 hover:text-slate-350 transition-colors cursor-pointer"
            >
              <Plus size={15} strokeWidth={3} />
            </button>
          </div>
        </div>

        {/* Page Controls */}
        <div className="flex items-center rounded-xl bg-[#3D3D3D] px-2 py-1.5 text-white shadow-sm">
          <button 
            aria-label="Previous page" 
            disabled={currentPage <= 1} 
            onClick={() => setCurrentPage((value) => value - 1)} 
            className="flex items-center justify-center p-1 hover:text-slate-350 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            <ChevronLeft size={16} strokeWidth={3} />
          </button>
          <span className="min-w-[70px] text-center text-[12px] font-bold">
            Page {currentPage} of {totalPages || 1}
          </span>
          <button 
            aria-label="Next page" 
            disabled={currentPage >= totalPages} 
            onClick={() => setCurrentPage((value) => value + 1)} 
            className="flex items-center justify-center p-1 hover:text-slate-350 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            <ChevronRight size={16} strokeWidth={3} />
          </button>
        </div>
      </div>

      {/* Answer continuation banner */}
      {regionPages.length > 1 && (
        <div className="flex gap-2 border-b border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-800 text-left items-center">
          <span className="font-semibold">Answer spans pages:</span>
          {regionPages.map((number) => (
            <button 
              key={number} 
              onClick={() => setCurrentPage(number)} 
              className={`underline hover:text-amber-950 font-bold transition-all px-1.5 py-0.5 rounded cursor-pointer ${
                currentPage === number ? "bg-amber-100 text-amber-900 border border-amber-300" : ""
              }`}
            >
              page {number}
            </button>
          ))}
        </div>
      )}

      {/* Document Viewer Area */}
      <div ref={containerRef} className="min-h-0 flex-1 overflow-auto p-4 sm:p-6 scroll-smooth">
        <div 
          className="relative mx-auto origin-top bg-white shadow-[0_8px_30px_rgba(0,0,0,0.12)] transition-all duration-200 border border-slate-300 rounded" 
          style={{ 
            width: `${zoomScale * 100}%`, 
            minWidth: `${zoomScale * 100}%`, 
            aspectRatio: `${1/pageAspect}` 
          }}
        >
          {/* Base Document Rendering Canvas */}
          <canvas
            ref={canvasRef}
            className="w-full h-full select-none block"
          />

          {/* Highlight Bounding Box Overlays */}
          {currentRegions.map((region, index) => {
            const left = `${region.bbox.x / 10}%`;
            const top = `${region.bbox.y / 10}%`;
            const width = `${region.bbox.width / 10}%`;
            const height = `${region.bbox.height / 10}%`;

            return (
              <div
                key={`mapped_${currentPage}_${index}`}
                aria-label="Mapped answer region"
                className="absolute z-10 rounded-[4px] border-2 border-[#1DB335] bg-[#1DB335]/15 shadow-[0_0_0_2px_rgba(255,255,255,0.3)] transition-all pointer-events-none"
                style={{ left, top, width, height }}
              >
                {/* Overlay Badge Tag */}
                <div className="absolute -left-0.5 -top-5 flex h-5 items-center justify-center rounded-t-[5px] bg-[#1DB335] px-2 text-[10px] font-bold text-white whitespace-nowrap">
                  Q{selectedLabel}
                </div>
              </div>
            );
          })}

          {/* Visual Elements (Multimodal detected items) highlights */}
          {selectedAnswer?.visualElements
            ?.filter((vel) => vel.page === currentPage)
            .map((vel, index) => {
              const left = `${vel.bbox.x / 10}%`;
              const top = `${vel.bbox.y / 10}%`;
              const width = `${vel.bbox.width / 10}%`;
              const height = `${vel.bbox.height / 10}%`;

              return (
                <div
                  key={`vel_${currentPage}_${index}`}
                  className="absolute border-2 border-violet-500 bg-violet-500/10 rounded-[4px] shadow-[0_0_8px_rgba(139,92,246,0.25)] transition-all pointer-events-none z-10"
                  style={{ left, top, width, height }}
                >
                  <span className="absolute -top-5 left-0 bg-violet-600 text-white font-extrabold text-[9px] px-1.5 py-0.5 rounded shadow-sm whitespace-nowrap">
                    {vel.type}: {vel.description.slice(0, 20)}...
                  </span>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
};

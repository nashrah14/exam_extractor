/* eslint-disable react-hooks/exhaustive-deps */
import React, { useRef, useEffect, useState } from 'react';
import { ZoomIn, ZoomOut, Maximize2, ChevronLeft, ChevronRight, CornerDownRight, FileText } from 'lucide-react';
import { AnswerRegion, Answer } from '@/lib/types';
import { scaleBox } from '@/lib/utils/coordinates';
import { mockAnswerSheetPages, MockPageData } from '@/lib/demo-data';

interface AnswerViewerProps {
  // If real mode, provide pages
  pages?: { pageNumber: number; dataUrl: string; width: number; height: number }[];
  // Active highlight regions for selected question
  activeRegions: AnswerRegion[];
  // Selected question text for context header
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
  const [containerWidth, setContainerWidth] = useState(650);
  const [pageAspect, setPageAspect] = useState(1.29);

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const highlightRef = useRef<HTMLDivElement>(null);

  // Total pages
  const totalPages = isDemoMode ? mockAnswerSheetPages.length : pages.length;

  // Ruled Notebook drawing utility for mock data (moved up to avoid TDZ lint error)
  const drawNotebookPage = (
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    pageNum: number,
    pageData?: MockPageData
  ) => {
    // US Letter standard 850x1100
    canvas.width = 850;
    canvas.height = 1100;

    // Draw page background
    ctx.fillStyle = '#fbfbf9';
    ctx.fillRect(0, 0, 850, 1100);

    // Draw notebook line rule margins (vertical red line)
    ctx.strokeStyle = '#fca5a5'; // light red
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(80, 0);
    ctx.lineTo(80, 1100);
    ctx.stroke();

    // Draw horizontal ruled lines
    ctx.strokeStyle = '#bfdbfe'; // light blue
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
    ctx.fillText(`ANSWER SHEET - PAGE ${pageNum}/${totalPages}`, 630, 45);

    // Draw handwriting text
    if (pageData) {
      pageData.lines.forEach((line) => {
        if (line.isLabel) {
          ctx.fillStyle = '#dc2626'; // Red pen for student labels
          ctx.font = 'bold italic 17px "Courier New", Courier, monospace';
        } else if (line.isMath) {
          ctx.fillStyle = '#1e3a8a'; // Dark blue pen for math
          ctx.font = 'bold italic 18px "Courier New", Courier, monospace';
        } else {
          ctx.fillStyle = '#1d4ed8'; // Royal blue pen for handwriting text
          ctx.font = 'italic 16px "Courier New", Courier, monospace';
        }
        ctx.fillText(line.text, line.x, line.y);
      });

      // Draw custom visual diagrams inside demo pages to support visual criteria
      if (pageNum === 1) {
        // Draw Plant Diagram
        ctx.strokeStyle = '#059669'; // Emerald green
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
        ctx.strokeStyle = '#b45309'; // Amber brown
        ctx.lineWidth = 2.0;
        ctx.beginPath();
        ctx.moveTo(425, 300);
        ctx.lineTo(410, 340);
        ctx.moveTo(425, 300);
        ctx.lineTo(440, 335);
        ctx.moveTo(425, 300);
        ctx.lineTo(428, 350);
        ctx.stroke();

        // Draw Labels text
        ctx.fillStyle = '#b45309';
        ctx.font = 'bold italic 12px "Courier New"';
        ctx.fillText('Water (Roots)', 340, 345);

        ctx.fillStyle = '#eab308'; // yellow sunlight label
        ctx.font = 'bold italic 12px "Courier New"';
        ctx.fillText('Sunlight', 380, 160);

        ctx.fillStyle = '#374151'; // carbon dioxide label
        ctx.font = 'bold italic 12px "Courier New"';
        ctx.fillText('Carbon dioxide', 260, 240);

        ctx.fillStyle = '#059669'; // oxygen label
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

  // Sync current page with first active region when question changes
  useEffect(() => {
    if (activeRegions.length > 0) {
      setCurrentPage(activeRegions[0].page);
    }
  }, [activeRegions]);

  // Adjust container width when fitting
  const handleFitToPage = () => {
    if (containerRef.current) {
      const parentWidth = containerRef.current.parentElement?.clientWidth || 650;
      setContainerWidth(parentWidth - 32); // subtract padding
      setZoomScale(1.0);
    }
  };

  // Run initial fit
  useEffect(() => {
    handleFitToPage();
    window.addEventListener('resize', handleFitToPage);
    return () => window.removeEventListener('resize', handleFitToPage);
  }, []);

  // Redraw canvas on page change or zoom change
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
        // Fallback clear canvas
        canvas.width = 650;
        canvas.height = 800;
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(0, 0, 650, 800);
        ctx.fillStyle = '#94a3b8';
        ctx.font = '14px Inter';
        ctx.fillText('No Answer Sheet Image Loaded', 220, 400);
      }
    }
  }, [currentPage, pages, isDemoMode]);

  // Handle auto scroll-to-highlight
  useEffect(() => {
    const activeRegion = activeRegions.find(r => r.page === currentPage);
    if (activeRegion && highlightRef.current && containerRef.current) {
      setTimeout(() => {
        highlightRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      }, 100);
    }
  }, [currentPage, activeRegions]);

  // Get active regions for the current page
  const currentRegions = activeRegions.filter(r => r.page === currentPage);
  
  // Calculate rendering size parameters
  const renderedWidth = containerWidth * zoomScale;
  const renderedHeight = renderedWidth * pageAspect;

  return (
    <div className="flex flex-col h-full bg-slate-900 border-slate-800 text-white select-none">
      {/* Top Header Panel */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 bg-slate-950 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-violet-400" />
          <div>
            <h3 className="text-sm font-semibold tracking-wide">Student Answer Sheet</h3>
            {selectedLabel && (
              <p className="text-xs text-slate-400 flex items-center gap-1">
                <CornerDownRight className="h-3.5 w-3.5 text-violet-400" />
                Highlighting: <span className="text-violet-300 font-bold">{selectedLabel}</span>
              </p>
            )}
          </div>
        </div>

        {/* Action Bar (Zoom, Pagination) */}
        <div className="flex items-center gap-4">
          {/* Zoom Actions */}
          <div className="flex items-center bg-slate-800 rounded-lg border border-slate-700 p-0.5">
            <button
              onClick={() => setZoomScale(Math.max(0.6, zoomScale - 0.1))}
              className="p-1.5 hover:bg-slate-700 hover:text-white rounded-md text-slate-400 transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="h-4 w-4" />
            </button>
            <span className="text-xs font-semibold px-2 text-slate-300 w-12 text-center">
              {Math.round(zoomScale * 100)}%
            </span>
            <button
              onClick={() => setZoomScale(Math.min(1.8, zoomScale + 0.1))}
              className="p-1.5 hover:bg-slate-700 hover:text-white rounded-md text-slate-400 transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="h-4 w-4" />
            </button>
            <button
              onClick={handleFitToPage}
              className="p-1.5 hover:bg-slate-700 hover:text-white rounded-md text-slate-400 border-l border-slate-700 transition-colors"
              title="Fit to Width"
            >
              <Maximize2 className="h-4 w-4" />
            </button>
          </div>

          {/* Pagination Actions */}
          <div className="flex items-center bg-slate-800 rounded-lg border border-slate-700 p-0.5">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="p-1.5 hover:bg-slate-700 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent rounded-md text-slate-400 transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-xs font-semibold px-2.5 text-slate-300">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 hover:bg-slate-700 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent rounded-md text-slate-400 transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Multi-page & Answer Region indicators */}
      {activeRegions.length > 0 && (() => {
        const uniquePages = Array.from(new Set(activeRegions.map((r) => r.page)));
        const spansMultiplePages = uniquePages.length > 1;

        return (
          <div className="flex flex-wrap items-center gap-3 px-6 py-2.5 bg-slate-900 border-b border-slate-800 text-xs">
            {spansMultiplePages ? (
              <span className="font-bold text-violet-300">Answer Spans Multiple Pages:</span>
            ) : (
              <span className="font-bold text-slate-400">Answer Regions:</span>
            )}
            <div className="flex flex-wrap items-center gap-1.5">
              {activeRegions.map((region, idx) => {
                const typeLabel = region.type
                  ? region.type.charAt(0).toUpperCase() + region.type.slice(1)
                  : `Region ${idx + 1}`;

                return (
                  <button
                    key={idx}
                    onClick={() => setCurrentPage(region.page)}
                    className={`px-2.5 py-1 rounded-md font-bold transition-all flex items-center gap-1.5 ${
                      currentPage === region.page
                        ? 'bg-violet-600 text-white shadow-sm ring-1 ring-violet-500 scale-[1.02]'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                    }`}
                  >
                    <FileText className="h-3.5 w-3.5 opacity-80" />
                    <span>
                      {typeLabel} (Page {region.page})
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* Canvas Viewport Viewer Container */}
      <div 
        ref={containerRef}
        className="flex-1 overflow-auto p-8 flex justify-center bg-slate-950 relative"
      >
        <div 
          className="relative select-none border border-slate-800 shadow-2xl rounded-sm bg-white"
          style={{ 
            width: `${renderedWidth}px`, 
            height: `${renderedHeight}px`,
            minWidth: `${renderedWidth}px`, 
            minHeight: `${renderedHeight}px` 
          }}
        >
          {/* Main Document Canvas */}
          <canvas
            ref={canvasRef}
            className="w-full h-full select-none"
          />

          {/* Highlight Bounding Box Overlays for student writing regions */}
          {currentRegions.map((region, idx) => {
            const box = scaleBox(region.bbox, renderedWidth, renderedHeight);
            return (
              <div
                key={`region_${idx}`}
                ref={idx === 0 ? highlightRef : null}
                className="absolute border-[2.5px] border-emerald-500 bg-emerald-500/10 rounded-md shadow-[0_0_12px_rgba(16,185,129,0.25)] animate-pulse transition-all duration-300 pointer-events-none"
                style={{
                  left: `${box.x}px`,
                  top: `${box.y}px`,
                  width: `${box.width}px`,
                  height: `${box.height}px`,
                }}
              >
                <span className="absolute -top-6 left-0 bg-emerald-600 text-white font-extrabold text-[9px] px-1.5 py-0.5 rounded shadow-sm">
                  Answer Region ({region.type})
                </span>
              </div>
            );
          })}

          {/* Highlight Bounding Box Overlays for visual elements (diagrams, equations) */}
          {selectedAnswer?.visualElements
            ?.filter((vel) => vel.page === currentPage)
            .map((vel, idx) => {
              const box = scaleBox(vel.bbox, renderedWidth, renderedHeight);
              return (
                <div
                  key={`vel_${idx}`}
                  className="absolute border-[2.5px] border-violet-500 bg-violet-500/10 rounded-md shadow-[0_0_12px_rgba(139,92,246,0.25)] transition-all duration-300 pointer-events-none"
                  style={{
                    left: `${box.x}px`,
                    top: `${box.y}px`,
                    width: `${box.width}px`,
                    height: `${box.height}px`,
                  }}
                >
                  <span className="absolute -top-6 left-0 bg-violet-600 text-white font-extrabold text-[9px] px-1.5 py-0.5 rounded shadow-sm">
                    {vel.type}: {vel.description.slice(0, 35)}...
                  </span>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
};

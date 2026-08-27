/* eslint-disable @typescript-eslint/no-explicit-any */
export interface RenderedPage {
  pageNumber: number;
  dataUrl: string;
  width: number;
  height: number;
}

/**
 * Converts a PDF file into an array of RenderedPage objects containing base64 JPEG data URLs.
 * Automatically scales the pages to a uniform resolution suitable for OCR vision understanding.
 * Loads pdfjs-dist dynamically to prevent server-side evaluation errors during Next.js build.
 */
export async function convertPdfToImages(
  file: File,
  onProgress?: (current: number, total: number) => void
): Promise<RenderedPage[]> {
  // Load pdfjs-dist dynamically on the client side only
  const pdfjs = await import('pdfjs-dist');
  
  pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;
  
  const pages: RenderedPage[] = [];
  const totalPages = pdf.numPages;

  for (let i = 1; i <= totalPages; i++) {
    const page = await pdf.getPage(i);
    
    // Choose scale to normalize width to around 1200px
    const initialViewport = page.getViewport({ scale: 1.0 });
    const targetWidth = 1200;
    const scale = targetWidth / initialViewport.width;
    const viewport = page.getViewport({ scale: Math.max(1, scale) });
    
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Could not create 2D canvas context.');
    }
    
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    
    await page.render({
      canvasContext: context,
      viewport: viewport,
    } as any).promise;
    
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    pages.push({
      pageNumber: i,
      dataUrl,
      width: viewport.width,
      height: viewport.height,
    });

    if (onProgress) {
      onProgress(i, totalPages);
    }
  }
  
  return pages;
}

/**
 * Converts a standard image file (PNG, JPG, WebP) to a RenderedPage object.
 */
export async function convertImageToRenderedPage(file: File): Promise<RenderedPage> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        resolve({
          pageNumber: 1,
          dataUrl: event.target?.result as string,
          width: img.width,
          height: img.height,
        });
      };
      img.onerror = () => {
        reject(new Error('Failed to load image file.'));
      };
      img.src = event.target?.result as string;
    };
    reader.onerror = () => {
      reject(new Error('Failed to read image file.'));
    };
    reader.readAsDataURL(file);
  });
}

# VedaAI Assessment Extraction & Answer Mapping Partner

VedaAI is a production-quality, responsive web application built for teachers to automate the review of exam submissions. By uploading a printed **Question Paper** (PDF/images) and a student's handwritten **Answer Sheet** (PDF/images), the system automatically extracts all questions, transcribes handwritten answers, maps them together (even if answered out-of-order or continuation spans multiple pages), evaluates correctness, and visually overlays coordinates directly onto the student's submission.

---

## 🌟 Features

- **Document Ingestion**: Seamlessly drag-and-drop or select PDF and image files for both the Question Paper and the Student Answer Sheet.
- **Client-Side Page Preprocessing**: Renders PDF pages to high-resolution JPEG canvases directly in the browser using PDF.js. This completely avoids heavy native PDF dependencies on serverless backends and ensures 100% Vercel deployment compatibility.
- **Hierarchical Question Extraction**: OCR-extracts every question in printed order, preserving numbering conventions (e.g., "1", "3(a)", "3(b)") and treating subquestions as distinct items.
- **Handwritten Answer OCR**: Vision analysis detects handwriting regions, transcribes written content, and registers students' reference labels (e.g., "Ans 1", "Q3(a)").
- **Robust Answer Mapping**: Combines label-matching heuristics with semantic similarity matching when a student omits question numbers.
- **Exact Coordinate Highlighting**: Normalizes coordinates in a `[0, 1000]` viewport, rendering translucent green highlights over answer regions that scale responsively to fit any screen resolution or zoom scale.
- **Multi-page Answer Support**: Identifies and combines answers that flow continuously across multiple pages, allowing teachers to click and jump directly between highlighted pages.
- **Unanswered & Unmatched Detections**: Logs questions left blank by the student and displays extra unmatched answers (e.g. "Q5 Extra credit") in a separate review list.
- **AI-Powered Grading & Feedback**: Generates scores, correctness tags, lists strengths, and provides advice on missing concepts.
- **Interactive Demo Mode**: Explore the full platform functionality instantly without an API key using realistic pre-configured mock scenarios.

---

## 🏗️ Architecture & Pipeline Flow

The application is designed around a client-coordinated, modular multi-stage pipeline:

```
[Upload PDF/Images] 
       │
       ▼ (Client-Side pdfjs-dist)
[Convert Pages to Images (JPEG Data URLs)]
       │
       ├─────────────────────────────────────────┐
       ▼ (Sequential POST)                       ▼ (Sequential POST)
[Stage 1: Question Paper OCR]              [Stage 2: Answer Sheet OCR]
(/api/extract-questions)                   (/api/extract-answers)
       │                                         │
       └────────────────────┬────────────────────┘
                            ▼ (POST payload)
                    [Stage 3: Answer Mapping]
                    (/api/map-answers)
                            │
                            ▼ (Parallel POST loop)
                    [Stage 4: AI Grading]
                    (/api/grade-answer)
                            │
                            ▼
                    [Results Inspector UI]
```

### Why a Multi-Stage Sequential Page Pipeline?
1. **Payload Size Constraints**: Sending massive multi-page PDF buffers in a single request violates serverless payload size limits (Vercel has a 4.5MB threshold).
2. **Timeout Resilience**: Extracting OCR, layout bounding boxes, and grading in one giant prompt regularly times out. Breaking the steps page-by-page allows each call to run in under 5 seconds.
3. **Step-by-Step Progress Bar**: Enables accurate step metrics (e.g., "OCR Scanning Page 2 of 4...") rather than a fake loader.
4. **Independent Retry Options**: If a single page extraction fails, only that page is re-processed, conserving token use.

---

## 🤖 AI Model & Prompt Engineering

### Model Selection
- **Primary Model**: `gemini-1.5-flash`
- **Why**: `gemini-1.5-flash` provides state-of-the-art vision OCR capabilities, low latency, and highly cost-efficient token pricing. It is exceptionally accurate at reading varied handwritten fonts and outputting normalized layout coordinates.

### Structured Schema Enforcements
Rather than relying on loose text outputs, we use Gemini's native `responseSchema` integration (via the `@google/generative-ai` SDK's `SchemaType` system). This enforces a rigid JSON contract directly at the model level, validated on return using standard Zod parsing.

- **Question Extraction Schema**: Strict constraints enforcing parent-child numbering relations and normalized coordinate shapes.
- **Answer Sheet Schema**: Forces structured returns containing raw text, confidence thresholds, and bounding boxes.
- **Answer Mapping Schema**: Dictates statuses (`matched`, `unanswered`, `unmatched`, `ambiguous`) and mappings.
- **Grading Schema**: Structures evaluation score boundaries (`score <= maxScore`), strengths, and advice.

---

## 📐 Bounding Box Highlighting Approach

To ensure overlays remain perfectly aligned regardless of container resizing, tablet viewports, or user zoom, coordinates are normalized:
- **Normalization**: The AI outputs regions relative to a virtual `1000 x 1000` grid representing the top-left `(0,0)` to bottom-right `(1000,1000)` corners of a page.
- **Coordinate Scaling Formula**:
  $$\text{renderX} = \frac{\text{normalizedX}}{1000} \times \text{renderedWidth}$$
  $$\text{renderY} = \frac{\text{normalizedY}}{1000} \times \text{renderedHeight}$$
  $$\text{renderWidth} = \frac{\text{normalizedWidth}}{1000} \times \text{renderedWidth}$$
  $$\text{renderHeight} = \frac{\text{normalizedHeight}}{1000} \times \text{renderedHeight}$$
- **UI Implementation**: Highlights are drawn as absolute-positioned `div` layers over the relative container holding the canvas. This guarantees perfect performance, lets us add CSS animations, and prevents canvas pollution.

---

## ⚙️ Edge Case Handling

- **Out-of-Order Submissions**: Mapped purely by logical question numbering and semantic alignment, completely independent of page arrays.
- **Multi-page Answer Continuation**: If a student continues writing Q1 on Page 3, the mapping module aggregates the texts and compiles regions, creating active navigation tabs in the viewer.
- **Unanswered & Unmatched Blocks**: Skipped questions remain clearly visible in the review sidebar. Extra unmatched writing blocks (like Q5) appear in a separate list.
- **No-Key Safe Fallback**: When `GEMINI_API_KEY` is not detected, the app blocks real pipeline calls and offers a clear, styled dialog prompting the user to run **Demo Mode** or set up credentials.

---

## 🛑 Limitations

- **Severely Distorted Handwriting**: Extremely messy or faint cursive handwriting may reduce transcript confidence.
- **Overlapping Writing**: If a student scribbles multiple answers inside the exact same physical line box, bounding boxes will overlap.
- **Mathematical Equations**: Raw transcript text displays LaTeX or ASCII approximations of complex mathematical symbols and chemical equations.

---

## 🚀 Setup & Execution

### 1. Prerequisites
Ensure you have [Node.js](https://nodejs.org/) (v18+) installed.

### 2. Installation
Clone the repository and install packages:
```bash
npm install
```

### 3. Environment Config
Create a `.env` file in the root directory (based on `.env.example`):
```text
GEMINI_API_KEY=your_actual_google_gemini_api_key_here
```

### 4. Running Locally
Run the Next.js development server:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Build for Production
Verify that compilation passes without TypeScript or ESLint errors:
```bash
npm run build
```

---

## ☁️ Deployment to Vercel

The architecture is fully verified for Vercel Serverless hosting:
1. Push your code repository to GitHub.
2. Link the repository to your [Vercel Dashboard](https://vercel.com).
3. Go to **Settings -> Environment Variables** and add `GEMINI_API_KEY`.
4. Deploy the application. Vercel automatically parses App Router API routes and deploys them as globally distributed Edge/Serverless functions.

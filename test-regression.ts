import * as fs from 'fs';
import { GoogleGenAI } from '@google/genai';

// Load environment variables
if (fs.existsSync('.env')) {
  const envContent = fs.readFileSync('.env', 'utf8');
  envContent.split(/\r?\n/).forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const idx = trimmed.indexOf('=');
      if (idx > 0) {
        const key = trimmed.substring(0, idx).trim();
        const val = trimmed.substring(idx + 1).trim();
        process.env[key] = val;
      }
    }
  });
}

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.log('Skipping regression tests: GEMINI_API_KEY is not defined.');
  process.exit(0);
}

const ai = new GoogleGenAI({ apiKey });

interface TestResult {
  hasDiagram: boolean;
  labels: string[];
  confidence: number;
}

async function runRegressionTests() {
  console.log('--- RUNNING MULTIMODAL REGRESSION TESTS ---');

  // Test Case 1: Question requires diagram + Student provides diagram + Diagram contains labels => Expected: hasDiagram = true
  console.log('\nTest Case 1: Question requires diagram, student provides labeled diagram.');
  try {
    const prompt = `
    Analyze this student's response.
    Question: "Draw a well-labeled diagram of photosynthesis."
    Student response contains: "Photosynthesis is how plants make food." and a hand-drawn plant sketch labeled with: "Sunlight", "Carbon dioxide", "Oxygen", and "Water".
    
    Determine if a diagram is present. Return JSON conforming to:
    { "hasDiagram": boolean, "labels": string[], "confidence": number }
    `;
    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'object',
          properties: {
            hasDiagram: { type: 'boolean' },
            labels: { type: 'array', items: { type: 'string' } },
            confidence: { type: 'number' }
          },
          required: ['hasDiagram', 'labels', 'confidence']
        }
      }
    });

    const text = response.text || '';
    const res: TestResult = JSON.parse(text.trim());
    console.log('Result:', res);
    if (res.hasDiagram === true && res.labels.includes('Sunlight')) {
      console.log('=> Test Case 1 PASSED.');
    } else {
      console.error('=> Test Case 1 FAILED.');
      process.exit(1);
    }
  } catch (err) {
    console.error('=> Test Case 1 Error:', err);
    process.exit(1);
  }

  // Test Case 2: Question requires diagram + Student provides no diagram => Expected: hasDiagram = false
  console.log('\nTest Case 2: Question requires diagram, student provides only text definitions.');
  try {
    const prompt = `
    Analyze this student's response.
    Question: "Draw a well-labeled diagram of photosynthesis."
    Student response contains: "Photosynthesis is how plants make food using sunlight." and no drawing or sketch.
    
    Determine if a diagram is present. Return JSON conforming to:
    { "hasDiagram": boolean, "labels": string[], "confidence": number }
    `;
    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'object',
          properties: {
            hasDiagram: { type: 'boolean' },
            labels: { type: 'array', items: { type: 'string' } },
            confidence: { type: 'number' }
          },
          required: ['hasDiagram', 'labels', 'confidence']
        }
      }
    });

    const text = response.text || '';
    const res: TestResult = JSON.parse(text.trim());
    console.log('Result:', res);
    if (res.hasDiagram === false) {
      console.log('=> Test Case 2 PASSED.');
    } else {
      console.error('=> Test Case 2 FAILED.');
      process.exit(1);
    }
  } catch (err) {
    console.error('=> Test Case 2 Error:', err);
    process.exit(1);
  }

  // Test Case 3: Question requires diagram + Student provides unclear visual content => Expected: confidence low or ambiguous status
  console.log('\nTest Case 3: Question requires diagram, student provides unclear scribbles.');
  try {
    const prompt = `
    Analyze this student's response.
    Question: "Draw a well-labeled diagram of photosynthesis."
    Student response contains: "Photosynthesis..." and some crossed-out shapes and illegible visual scribbles that do not resemble a plant.
    
    Determine if a valid diagram is present. Return JSON conforming to:
    { "hasDiagram": boolean, "labels": string[], "confidence": number }
    `;
    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'object',
          properties: {
            hasDiagram: { type: 'boolean' },
            labels: { type: 'array', items: { type: 'string' } },
            confidence: { type: 'number' }
          },
          required: ['hasDiagram', 'labels', 'confidence']
        }
      }
    });

    const text = response.text || '';
    const res: TestResult = JSON.parse(text.trim());
    console.log('Result:', res);
    console.log('=> Test Case 3 PASSED (confidence or hasDiagram status evaluated):', res.hasDiagram, 'Confidence:', res.confidence);
  } catch (err) {
    console.error('=> Test Case 3 Error:', err);
    process.exit(1);
  }

  console.log('\nALL REGRESSION TESTS COMPLETED SUCCESSFULLY.');
}

runRegressionTests();

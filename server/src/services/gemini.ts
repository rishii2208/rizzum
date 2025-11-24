import { GoogleGenerativeAI } from "@google/generative-ai";
import { config } from "../config.js";
import type { OptimizeRequestPayload } from "../types.js";

export class GeminiMissingKeyError extends Error {
  constructor() {
    super("GEMINI_API_KEY is missing");
    this.name = "GeminiMissingKeyError";
  }
}

export class GeminiApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GeminiApiError";
  }
}

const buildPrompt = ({ jd, resume }: OptimizeRequestPayload) => `You are an software developer who will optimise resume contents as per JD given. You know AI, backend dvelopment, frontend development, databases, data structures and algorithms very well and have projects .

Instructions:
1. Read the job description (JD) and align the resume contents(skills, internship experience content) accordingly, add keywords in between to get max ATS score as per the JD.
2. Preserve the original structure when possible
3. Keep the output VALID LaTeX that can be compiled with pdflatex.
4. Do not include any explanation outside of the LaTeX document.
5. Add/ remove skills as per JD mentioned to get max ATS score
6. The resume will be given in LateX format, so change the latex content.
### Job Description
${jd}

### Current Resume (LaTeX)
${resume}`;

const callGemini = async (payload: OptimizeRequestPayload) => {
  try {
    const genAI = new GoogleGenerativeAI(config.geminiKey!);
    const model = genAI.getGenerativeModel({ model: config.geminiModel });

    const prompt = buildPrompt(payload);
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    if (!text?.trim()) {
      throw new GeminiApiError("Gemini returned an empty response");
    }

    return text.trim();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gemini API request failed";
    throw new GeminiApiError(message);
  }
};

export const optimizeResume = async (payload: OptimizeRequestPayload) => {
  if (!config.geminiKey) {
    throw new GeminiMissingKeyError();
  }

  try {
    return await callGemini(payload);
  } catch (error) {
    console.error("[gemini] API call failed", error);
    if (error instanceof GeminiApiError) {
      throw error;
    }
    throw new GeminiApiError(error instanceof Error ? error.message : "Gemini API call failed");
  }
};

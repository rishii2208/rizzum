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

const buildPrompt = ({ jd, resume }: OptimizeRequestPayload) => `You are an assistant for an unemployed software developer who will optimise present resume contents as per JD given.You will be getting a latex file of present resume and you only have to change only content of latex resume, not structure or any header file( Very important).Your goal is to make changes in resume(add or modify or remove words or sentences in resume) in a way that it scores 100% as per present Job description given, and rank top in the database of job applications in sites like workday, indeed etc. You know AI, backend dvelopment, frontend development, databases, data structures and algorithms very well and have projects.So, optimise resume as per JD resuirements. For example if a job has backend Development role remove irrelevant skills like AI or Data processing or Machine learning. make resume relevant to the JD.  Rewire JD keyowrds into resume whereever relevant to stay competitive and rank best in resumes database.

Instructions:
1. Read the job description (JD) and align the resume contents and keywords accordingly to maximise ATS score and rank best. add/remove/edit keywords in resume wherever relevant to get max ATS score as per the JD.
2. Return only Latex Code in Output, nothing else. Do not add '''latex in the output. Only code
3. Change only contents, never change structure or code.
4. Add JD in the ending in \\whitetext to get max ATS score .
5. Check the resume again for any irrlevant keywords nad completely remove them.
6. Finally return The resume tex ina given LateX format.
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

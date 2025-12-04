import { GoogleGenerativeAI } from "@google/generative-ai";
import { config } from "../config.js";
import type {
  EmailOptimizeRequestPayload,
  EmailOptimizeResponse,
  OptimizeRequestPayload
} from "../types.js";

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

const buildPrompt = ({ jd, resume }: OptimizeRequestPayload) => `You are an unemployed software developer who will optimise present resume contents as per JD given.Your goal is to make changes in resume(add or modify or remove words or sentences in resume) in a way that it scores 100% as per present Job description given, and rank top in the database of job applications in sites like workday, indeed etc. You know AI, backend dvelopment, frontend development, databases, data structures and algorithms very well and have projects.So, optimise resume as per JD resuirements. For example if a job has backend Development role remove irrelevant skills like AI or Data processing or Machine learning. make resume relevant to the JD.  Rewire JD keyowrds into resume whereever relevant to stay competitive and rank best in resumes database.

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

const buildEmailPrompt = ({ description, template, subject = "" }: EmailOptimizeRequestPayload) => `You are an expert software engineer and outreach copywriter. Your job is to rewrite and personalise the cold email template so it feels tailored, grounded in the sender's background, and highly relevant to the opportunity described.

Follow these instructions carefully:
1. Study the outreach context to understand the role, company, team priorities, and any standout details.
2. When placeholders such as [first name], [role], [company], or bracketed instructions appear, replace them with the best fit derived from the context. If information is missing, substitute a warm generic alternative (for example, "Hi there" or "hiring team").
3. Use achievements and skills from the personal profile below that align with the role. Highlight at most two concrete, quantified wins to keep the message concise.
4. Maintain a warm, confident tone in the first person. Keep the email under 160 words. Avoid buzzwords and filler.
5. End with a clear call-to-action for a short conversation and sign off with the sender's full name plus the contact information from the personal profile.
6. Ensure the email is immediately sendable and does not expose placeholder tokens.

Available material for you to ground the rewrite:

Personal profile of the sender:
${PERSONAL_PROFILE}

Reference outreach template (structure to respect, but personalise it):
${EMAIL_BASE_TEMPLATE}

Starting subject line from the user (may be empty):
${subject || "(no subject provided)"}

User-provided draft email body (edited base template):
${template}

Job description or outreach context:
${description}

Output requirements:
- Return ONLY a valid JSON object with keys "subject" and "body". Do not include code fences or commentary.
- "subject": the personalised subject line (max 90 characters) that references the role/company context.
- "body": the final multi-line email body with paragraph breaks represented using \n.
- Make sure both fields are strings.`;

const callGemini = async (prompt: string) => {
  try {
    const genAI = new GoogleGenerativeAI(config.geminiKey!);
    const model = genAI.getGenerativeModel({ model: config.geminiModel });

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

const extractJsonCandidate = (text: string) => {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    return null;
  }

  return text.slice(start, end + 1);
};

const parseEmailOptimization = (raw: string): EmailOptimizeResponse => {
  const trimmed = raw.trim();
  const candidate = trimmed.startsWith("{") ? trimmed : extractJsonCandidate(trimmed);

  if (!candidate) {
    throw new GeminiApiError("Gemini returned malformed email output");
  }

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(candidate);
  } catch (error) {
    throw new GeminiApiError("Gemini returned invalid JSON for email output");
  }

  const subjectValue = typeof parsed.subject === "string" ? parsed.subject : typeof parsed.Subject === "string" ? parsed.Subject : null;
  const bodyValue = typeof parsed.body === "string" ? parsed.body : typeof parsed.Body === "string" ? parsed.Body : null;

  if (!subjectValue?.trim() || !bodyValue?.trim()) {
    throw new GeminiApiError("Gemini email output is missing subject or body");
  }

  return {
    optimizedSubject: subjectValue.trim(),
    optimizedBody: bodyValue.replace(/\r\n/g, "\n").trim()
  };
};

export const optimizeResume = async (payload: OptimizeRequestPayload) => {
  if (!config.geminiKey) {
    throw new GeminiMissingKeyError();
  }

  try {
    const prompt = buildResumePrompt(payload);
    return await callGemini(prompt);
  } catch (error) {
    console.error("[gemini] resume API call failed", error);
    if (error instanceof GeminiApiError) {
      throw error;
    }
    throw new GeminiApiError(error instanceof Error ? error.message : "Gemini API call failed");
  }
};

export const optimizeEmail = async (payload: EmailOptimizeRequestPayload): Promise<EmailOptimizeResponse> => {
  if (!config.geminiKey) {
    throw new GeminiMissingKeyError();
  }

  try {
    const prompt = buildEmailPrompt(payload);
    const raw = await callGemini(prompt);
    return parseEmailOptimization(raw);
  } catch (error) {
    console.error("[gemini] email API call failed", error);
    if (error instanceof GeminiApiError) {
      throw error;
    }
    throw new GeminiApiError(error instanceof Error ? error.message : "Gemini API call failed");
  }
};

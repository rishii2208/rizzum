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

const PERSONAL_PROFILE = `Rishi Raj Prajapati
870-016-8283 | rishirajprajapati22@gmail.com | linkedin.com/in/rishi-raj-prajapati/ | github.com/rishii2208
Summary
Highly motivated Software Developer with a strong background in C++, Python, data structures, algorithms, and object-oriented programming. Proven ability to design, build, and maintain efficient, scalable, and reliable low-latency/high-throughput systems. Eager to apply brilliant problem-solving abilities and collaborative skills to a fast-paced trading environment, developing cutting-edge software solutions for market analysis and operational workflows.
Education
Delhi Technological University Delhi, IN
BTech, Majors in ECE, Minors in AI-ML Aug 2022 - May 2026
Experience
AOC May 2025 - Jul 2025
Software Development Intern Noida, Onsite
 - Designed, built, and optimized RESTful APIs using FastAPI and PostgreSQL, achieving average 120ms latency under high-concurrency workloads for reliable, real-time applications.
 - Developed scalable authentication and data management pipelines, implementing robust schema migrations and token-based security, utilizing asynchronous I/O to significantly improve system throughput and reliability.
Zebpay Mar 2024 - Aug 2024
Software Development Intern Mumbai, IN
 - Designed and deployed a real-time market analysis and performance-tracking API leveraging machine learning models on historical trading data, achieving low-latency inference at scale for operational workflows.
 - Collaborated with cross-functional teams to integrate and deploy new features on a high-traffic platform serving 5M+ active users, translating business needs into technical requirements within large-scale production codebases.
Projects
MindMapper | JavaScript, FastAPI, Python, Docker, OpenAI Embeddings, ChromaDB Link
 - Developed MindMapper, a scalable software solution utilizing React.js and FastAPI to transform multi-format data into interactive mind maps for enhanced knowledge representation and operational workflows.
 - Implemented a unique depth-first conversational flow with dynamic node creation and cross-referencing, showcasing efficient data management and flexible system design.
 - Leveraged vector embeddings with ChromaDB for semantic chunking and efficient search, enabling intelligent linking of insights across diverse data sources for data analysis.
Slander | JavaScript, WebRTC, Algorithms Link
 - Engineered Slander, a P2P real-time video chat platform, demonstrating robust system design for user verification and efficient matchmaking algorithms to enhance user experience.
 - Achieved ultra-low-latency live video streaming (200ms delay) and high-throughput communication through advanced WebRTC optimizations, showcasing expertise in high-performance production environments.
Technical Skills
Programming Languages: C++, Python, JavaScript, SQL, TypeScript
Web/Backend: FastAPI, React.js, Node.js, RESTful APIs
Databases/Tools: PostgreSQL, Redis, ChromaDB, Git, GitHub
DevOps/Cloud/OS: Docker, Kubernetes, CI/CD, AWS (EC2, S3), Google Cloud Platform (GCP), Linux, Shell Scripting
Core CS: Data Structures & Algorithms, Object-Oriented Programming (OOP), System Design Principles, Operating Systems, DBMS, Concurrency
AI/ML (Proficiency): XGBoost, LSTM, OpenAI Embeddings, Prompt Engineering, Scikit-learn
Achievements
 - Excelled in Data Structures and Algorithms by solving 300+ LeetCode problems, achieving a rating of 1570, demonstrating brilliant problem-solving abilities.
 - Served as Coordinator and Secretary of Invictus DTU, mentoring 200+ students and orchestrating 3 national-level hackathons and numerous technical events and conferences, showcasing strong communication and organizational skills.
 - Secured victories in 3 national-level hackathons (5000+ registrations) and 7 additional competitions (500+ participants), showcasing strong development background, collaboration, and the ability to manage multiple tasks in a fast-paced environment.`;

const EMAIL_BASE_TEMPLATE = `hi [first name],

i came across the [role] at [company] and wanted to reach out, not just because of the job title, but because [insert 1-2 specific reasons you actually care about this company or role].

i'm currently [your current role / situation] and recently [insert a quick, relevant win or project you worked on].
i'd love to learn more about how i could bring that energy to your team.

if you're the right person to chat with, i'd be super grateful for a quick convo or happy to be pointed to whoever handles hiring for this role.

thanks so much for the time,
[your name]
[your linkedin / portfolio link]`;

const buildResumePrompt = ({ jd, resume }: OptimizeRequestPayload) => `You are an unemployed software developer who will optimise present resume contents as per JD given.Your goal is to make changes in resume(add or modify or remove words or sentences in resume) in a way that it scores 100% as per present Job description given, and rank top in the database of job applications in sites like workday, indeed etc. You know AI, backend dvelopment, frontend development, databases, data structures and algorithms very well and have projects.So, optimise resume as per JD resuirements. For example if a job has backend Development role remove irrelevant skills like AI or Data processing or Machine learning. make resume relevant to the JD.  Rewire JD keyowrds into resume wherever relevant to stay competitive and rank best in resumes database.

Instructions:
1. Read the job description (JD) and align the resume contents and keywords accordingly to maximise ATS score and rank best. add/remove/edit keywords in resume wherever relevant to get max ATS score as per the JD.

3. Presere and Keep the output VALID LaTeX that can be compiled with pdflatex.
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

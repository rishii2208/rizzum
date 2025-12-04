import { useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { Panel } from "../components/Panel.tsx";
import { optimizeEmail } from "../lib/api.ts";
import type { EmailOptimization } from "../types.ts";

type ApiErrorResponse = { message?: string };

const DEFAULT_DESCRIPTION = `We're opening a Software Engineer role focused on building next-gen AI productivity tooling. The person will partner with product leads to ship features, move fast, and keep quality high. Core stack is React, TypeScript, Node.js, and GCP. Experience working with LLM APIs, orchestrating prompts, and shipping reliable user-facing experiences is critical.`;

const DEFAULT_SUBJECT = "Curious about the Software Engineer role at [company]";

const DEFAULT_TEMPLATE = `hi [first name],

i came across the [role] at [company] and wanted to reach out, not just because of the job title, but because [insert 1-2 specific reasons you actually care about this company or role].

i'm currently [your current role / situation] and recently [insert a quick, relevant win or project you worked on].
i'd love to learn more about how i could bring that energy to your team.

if you're the right person to chat with, i'd be super grateful for a quick convo or happy to be pointed to whoever handles hiring for this role.

thanks so much for the time,
[your name]
[your linkedin / portfolio link]`;

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

const getErrorMessage = (error: unknown, fallback: string) => {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as ApiErrorResponse | undefined;
    return data?.message || error.message || fallback;
  }

  if (error instanceof Error) {
    return error.message || fallback;
  }

  return fallback;
};

export function EmailPage() {
  const [description, setDescription] = useState(DEFAULT_DESCRIPTION);
  const [subject, setSubject] = useState(DEFAULT_SUBJECT);
  const [template, setTemplate] = useState(DEFAULT_TEMPLATE);
  const [results, setResults] = useState<EmailOptimization>({ optimizedSubject: "", optimizedBody: "" });
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleOptimize = async () => {
    if (!description.trim() || !template.trim()) {
      setError("Both context and email template are required");
      return;
    }

    setError(null);
    setIsOptimizing(true);
    try {
      const { data } = await optimizeEmail({ description, template, subject });
      setResults(data);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to optimize email"));
    } finally {
      setIsOptimizing(false);
    }
  };

  const hasSubjectResult = results.optimizedSubject.trim().length > 0;
  const hasBodyResult = results.optimizedBody.trim().length > 0;

  return (
    <div className="min-h-screen bg-slate-50 pb-12 text-slate-900">
      <header className="space-y-4 border-b-8 border-slate-900 bg-slate-50/90 px-6 py-8 shadow-[0_12px_0_0_#0f172a]">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-700">Outreach Email Studio</p>
        <div className="flex flex-wrap items-center gap-2 text-sm font-semibold">
          <Link
            to="/"
            className="rounded-full border-2 border-slate-900 bg-white px-3 py-1 text-slate-900 shadow-[4px_4px_0_0_#0f172a] transition hover:-translate-y-0.5 hover:bg-slate-100"
          >
            Resume Optimizer
          </Link>
          <span className="rounded-full bg-slate-900 px-3 py-1 text-white shadow-[4px_4px_0_0_#0f172a]">Email</span>
        </div>
        <div className="max-w-3xl text-sm text-slate-700">
          <p>
            Personalize the cold email template with the job description or outreach brief. Gemini rewrites the subject line and
            body using Rishi Raj Prajapati's background, keeping the draft warm and specific.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleOptimize}
            disabled={isOptimizing}
            className="flex items-center gap-2 rounded-full bg-emerald-500 px-6 py-3 text-sm font-semibold text-white shadow-[6px_6px_0_0_#0f172a] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isOptimizing ? "Optimizing…" : "Optimize Email"}
          </button>
          {error && <p className="text-sm font-semibold text-rose-600">{error}</p>}
        </div>
      </header>

      <main className="grid gap-6 p-6 lg:grid-cols-2">
        <div className="lg:col-span-2">
          <Panel title="Job Description or Outreach Context">
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className="min-h-[140px] w-full rounded-2xl border-2 border-slate-900 bg-white px-4 py-3 font-mono text-sm text-slate-900 shadow-[6px_6px_0_0_#0f172a] outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-200"
            />
          </Panel>
        </div>

        <Panel title="Original Email Subject">
          <input
            type="text"
            value={subject}
            onChange={(event) => setSubject(event.target.value)}
            className="w-full rounded-2xl border-2 border-slate-900 bg-white px-4 py-3 text-sm font-semibold text-slate-900 shadow-[6px_6px_0_0_#0f172a] outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-200"
            placeholder="Subject line"
          />
        </Panel>

        <Panel title="Original Email Template">
          <textarea
            value={template}
            onChange={(event) => setTemplate(event.target.value)}
            className="min-h-[240px] w-full rounded-2xl border-2 border-slate-900 bg-white px-4 py-3 font-mono text-sm text-slate-900 shadow-[6px_6px_0_0_#0f172a] outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-200"
          />
        </Panel>

        <Panel title="Optimized Email Subject" actions={<span className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600">AI Crafted</span>}>
          <p
            className={`rounded-2xl border-2 px-4 py-3 text-sm font-semibold shadow-[6px_6px_0_0_#0f172a] ${
              hasSubjectResult
                ? "border-emerald-500 bg-emerald-50 text-emerald-900"
                : "border-dashed border-slate-400 bg-white text-slate-500"
            }`}
          >
            {hasSubjectResult ? results.optimizedSubject : "Run Optimize Email to generate a subject line."}
          </p>
        </Panel>

        <Panel title="Optimized Email Body" actions={<span className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600">Ready to send</span>}>
          <textarea
            value={results.optimizedBody}
            readOnly
            placeholder="Optimized email will appear here after you run Optimize Email."
            className={`min-h-[260px] w-full rounded-2xl border-2 px-4 py-3 font-mono text-sm shadow-[6px_6px_0_0_#0f172a] ${
              hasBodyResult
                ? "border-emerald-500 bg-emerald-50 text-emerald-900"
                : "border-dashed border-slate-400 bg-white text-slate-500"
            }`}
          />
        </Panel>

        <div className="lg:col-span-2">
          <Panel title="Personal Details Used for Personalization">
            <pre className="max-h-64 overflow-auto whitespace-pre-wrap rounded-2xl border-2 border-slate-900 bg-white px-4 py-3 text-xs text-slate-700 shadow-[6px_6px_0_0_#0f172a]">
              {PERSONAL_PROFILE}
            </pre>
          </Panel>
        </div>
      </main>
    </div>
  );
}
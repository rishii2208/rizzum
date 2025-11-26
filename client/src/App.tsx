import { type PropsWithChildren, type ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import Editor from "@monaco-editor/react";
import { ScoreBadge } from "./components/ScoreBadge.tsx";
import { useDebounce } from "./hooks/useDebounce.ts";
import { compileLatex, fetchAtsScore, optimizeResume } from "./lib/api.ts";
import type { AtsScore } from "./types.ts";

type ApiErrorResponse = { message?: string };

const DEFAULT_JD = `We need a Senior Software Engineer to build AI-powered developer tools.
Must have: React, TypeScript, Node.js, cloud (GCP/AWS) experience, and experience working with LLM APIs.
Nice to have: TailwindCSS, PDF generation, ATS integrations.`;

const DEFAULT_RESUME = `\documentclass[letterpaper,11pt]{article}

\\usepackage{latexsym}
\\usepackage[empty]{fullpage}
\\usepackage{titlesec}
\\usepackage{marvosym}
\\usepackage[usenames,dvipsnames]{xcolor}
\\usepackage{enumitem}
\\usepackage[hidelinks]{hyperref}
\\usepackage{fancyhdr}
\\usepackage[english]{babel}
\\usepackage{tabularx}

\\pagestyle{fancy}
\\fancyhf{}
\\fancyfoot{}
\\renewcommand{\headrulewidth}{0pt}
\\renewcommand{\footrulewidth}{0pt}

\\addtolength{\\oddsidemargin}{-0.5in}
\\addtolength{\\evensidemargin}{-0.5in}
\\addtolength{\\textwidth}{1in}
\\addtolength{\\topmargin}{-0.5in}
\\addtolength{\\textheight}{1.0in}

\\urlstyle{same}

\\raggedbottom
\\raggedright
\\setlength{\\tabcolsep}{0in}

\\titleformat{\\section}{
  \\vspace{-4pt}\\scshape\\raggedright\\large
}{}{0em}{}[\\color{black}\\titlerule \\vspace{-5pt}]
\\newcommand{\\resumeItem}[1]{
  \\item\\small{
    {#1 \\vspace{-2pt}}
  }
}

\newcommand{\resumeSubheading}[4]{
  \vspace{-2pt}\item
    \begin{tabular*}{0.97\textwidth}[t]{l@{\extracolsep{\fill}}r}
      \textbf{#1} & #2 \\
      \textit{\small#3} & \textit{\small #4} \\
    \end{tabular*}\vspace{-7pt}
}

\newcommand{\resumeSubSubheading}[2]{
    \item
    \begin{tabular*}{0.97\textwidth}{l@{\extracolsep{\fill}}r}
      \textit{\small#1} & \textit{\small #2} \\
    \end{tabular*}\vspace{-7pt}
}

\newcommand{\resumeProjectHeading}[2]{
    \item
    \begin{tabular*}{0.97\textwidth}{l@{\extracolsep{\fill}}r}
      \small#1 & #2 \\
    \end{tabular*}\vspace{-7pt}
}

\newcommand{\resumeSubItem}[1]{\resumeItem{#1}\vspace{-4pt}}

\renewcommand\labelitemii{$\vcenter{\hbox{\tiny$\bullet$}}$}

\newcommand{\resumeSubHeadingListStart}{\begin{itemize}[leftmargin=0.15in, label={}]}
\newcommand{\resumeSubHeadingListEnd}{\end{itemize}}
\newcommand{\resumeItemListStart}{\begin{itemize}}
\newcommand{\resumeItemListEnd}{\end{itemize}\vspace{-5pt}}

\newcommand{\whitetext}[1]{{\fontsize{1pt}{1pt}\selectfont\textcolor{white}{#1}}}

%-------------------------------------------
%%%%%%  RESUME STARTS HERE  %%%%%%%%%%%%%%%%%%%%%%%%%%%%

\begin{document}

\begin{center}
    \textbf{\Huge \scshape Rishi Raj Prajapati} \\ \vspace{1pt}
    \small 870-016-8283 $|$ 
    \\href{mailto:rishirajprajapati22@gmail.com}{\\underline{rishirajprajapati22@gmail.com}} $|$ 
    \\href{https://www.linkedin.com/in/rishi-raj-prajapati/}{\\underline{linkedin.com/in/rishi-raj-prajapati/}} $|$
    \\href{https://www.github.com/rishii2208}{\\underline{github.com/rishii2208}}
\end{center}

\section{Education}
  \resumeSubHeadingListStart
    \resumeSubheading
      {Delhi Technological University}{Delhi, IN}
      {BTech, Majors in ECE, Minors in AI-ML}{Aug 2022 -- May 2026}
  \resumeSubHeadingListEnd

%-----------EXPERIENCE-----------
\section{Experience}
  \resumeSubHeadingListStart

    \resumeSubheading
      {AOC}{May 2025 -- Jul 2025}
      {Software Development Intern}{Noida, Onsite}
      \resumeItemListStart
        \resumeItem{Engineered and optimized RESTful APIs using FastAPI and PostgreSQL, achieving an average 120ms latency under high-concurrency workloads for real-time applications.}
        \resumeItem{Developed scalable authentication and data management pipelines with robust schema migrations and token-based security, utilizing asynchronous I/O to improve system throughput and reliability.}
      \resumeItemListEnd

    \resumeSubheading
      {Zebpay}{Mar 2024 -- Aug 2024}
      {Software Development Intern}{Mumbai, IN}
      \resumeItemListStart
        \resumeItem{Designed and deployed a real-time crypto price prediction API using XGBoost and LSTM models on historical trading data, achieving 92\% predictive accuracy across major tokens with low-latency inference at scale.}
        \resumeItem{Collaborated with a cross-functional full-stack team to integrate and deploy new features on a high-traffic platform serving 5M+ active users, working within large-scale production codebases.}
      \resumeItemListEnd

  \resumeSubHeadingListEnd

%-----------PROJECTS-----------
\section{Projects}
    \resumeSubHeadingListStart
      \resumeProjectHeading
          {\textbf{MindMapper} $|$ \emph{JavaScript, FastAPI, Python, Docker, OpenAI Embeddings, ChromaDB}}{\href{https://github.com/rishii2208/AIMindMapper}{Link}}
          \resumeItemListStart
            \resumeItem{Developed MindMapper, an AI-powered tool using React.js and FastAPI to transform multi-format data into interactive, branching mind maps for enhanced knowledge representation.}
            \resumeItem{Implemented a unique sideways, depth-first conversational flow with dynamic node creation and cross-referencing, moving beyond typical top-down LLM interactions.}
            \resumeItem{Leveraged OpenAI embeddings with ChromaDB for semantic chunking and vector search, enabling intelligent linking of insights across diverse data sources.}
          \resumeItemListEnd

      \resumeProjectHeading
          {\textbf{Slander} $|$ \emph{JavaScript, WebRTC, AI, Algorithms}}{\href{http://slander.live}{Link}}
          \resumeItemListStart
            \resumeItem{Engineered Slander, a P2P real-time video chat platform featuring user verification, AI-based abuse detection, and matchmaking algorithms to enhance user experience and safety.}
            \resumeItem{Achieved ultra-low-latency live video streaming (200ms delay) and a smooth user experience through advanced WebRTC optimizations.}
          \resumeItemListEnd
    \resumeSubHeadingListEnd

%-----------PROGRAMMING SKILLS-----------
\section{Technical Skills}
 \begin{itemize}[leftmargin=0.15in, label={}]
    \small{\item{
     \textbf{Programming Languages}{: Python, JavaScript, SQL, TypeScript} \\
     \textbf{AI/ML}{: XGBoost, LSTM, OpenAI Embeddings, Prompt Engineering, Scikit-learn} \\
     \textbf{Web/Backend}{: FastAPI, React.js, RESTful APIs, Node.js} \\
     \textbf{Databases/Tools}{: PostgreSQL, Redis, ChromaDB, Git, GitHub} \\
     \textbf{DevOps/Cloud}{: Docker, Kubernetes, CI/CD, AWS (EC2, S3), Google Cloud Platform (GCP)} \\
     \textbf{Core CS}{: Data Structures \& Algorithms, Object-Oriented Programming (OOP), Operating Systems, DBMS}
    }}
 \end{itemize}

%-----------ACHIEVEMENTS-----------
\section{Achievements}
\resumeItemListStart
    \resumeItem{Excelled in Data Structures and Algorithms by solving 300+ LeetCode problems, achieving a rating of 1570, demonstrating strong problem-solving skills.}
    \resumeItem{Served as Coordinator and Secretary of Invictus DTU, mentoring 200+ students and orchestrating 3 national-level hackathons and numerous technical events and conferences.}
    \resumeItem{Secured victories in 3 national-level hackathons (5000+ registrations) and 7 additional competitions (500+ participants), showcasing strong development background and collaborative skills.}
\resumeItemListEnd

\whitetext{Data Structures, Algorithms, Object-Oriented Programming (OOP), Operating Systems, Database Management Systems (DBMS), Computer Networks, Java, Python, C++, JavaScript, TypeScript, React, Node.js, Express.js, Spring Boot, Django, FastAPI, RESTful APIs, Microservices, SQL, MySQL, PostgreSQL, MongoDB, Redis, Git, GitHub, Linux/Unix, Docker, Kubernetes, AWS, Google Cloud (GCP), CI/CD, Jenkins, Unit Testing, JUnit, PyTest, Agile/Scrum, System Design (Basics), Design Patterns, SOLID Principles, Concurrency/Multithreading, Message Queues (Kafka), Caching, Problem-Solving, Competitive Programming, Hackathons, LeetCode, CodeChef, Codeforces, CGPA 8.0+}

\end{document}
`;

const editorOptions = {
  fontSize: 14,
  minimap: { enabled: false },
  scrollBeyondLastLine: false,
  wordWrap: "on",
  automaticLayout: true
} as const;

const getErrorMessage = (err: unknown, fallback: string) => {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as ApiErrorResponse | undefined;
    return data?.message || err.message || fallback;
  }

  if (err instanceof Error) {
    return err.message || fallback;
  }

  return fallback;
};

type PanelProps = PropsWithChildren<{ title: string; actions?: ReactNode }>;

const Panel = ({ title, children, actions }: PanelProps) => (
  <section className="space-y-4 rounded-[32px] border-4 border-slate-900 bg-white/90 p-5 shadow-[8px_8px_0_0_#0f172a]">
    <div className="flex items-center justify-between gap-3">
      <h2 className="text-lg font-black tracking-wide text-slate-900">{title}</h2>
      {actions}
    </div>
    {children}
  </section>
);

function App() {
  const [jd, setJd] = useState(DEFAULT_JD);
  const [resume, setResume] = useState(DEFAULT_RESUME);
  const [optimizedLatex, setOptimizedLatex] = useState(DEFAULT_RESUME);
  const [pdfBase64, setPdfBase64] = useState<string>("");
  const [atsScore, setAtsScore] = useState<AtsScore | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isCompiling, setIsCompiling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const debouncedLatex = useDebounce(optimizedLatex, 800);

  const pdfDataUrl = useMemo(() => (pdfBase64 ? `data:application/pdf;base64,${pdfBase64}` : null), [pdfBase64]);

  const compile = useCallback(async (latex: string) => {
    try {
      if (!latex.trim()) return;
      setIsCompiling(true);
      const { data } = await compileLatex(latex);
      setPdfBase64(data.pdfBase64);
    } catch (err) {
      console.error(err);
      setError(getErrorMessage(err, "Failed to compile LaTeX"));
    } finally {
      setIsCompiling(false);
    }
  }, []);

  useEffect(() => {
    compile(debouncedLatex);
  }, [compile, debouncedLatex]);

  const runAtsScore = useCallback(async (payload: { jd: string; resume: string }) => {
    try {
      const { data } = await fetchAtsScore(payload);
      setAtsScore(data);
    } catch (err) {
      console.error(err);
    }
  }, []);

  const handleOptimize = async () => {
    if (!jd.trim() || !resume.trim()) {
      setError("Both JD and resume LaTeX are required");
      return;
    }

    setIsOptimizing(true);
    setError(null);
    try {
      const { data } = await optimizeResume({ jd, resume });
      setOptimizedLatex(data.optimizedLatex);
      await runAtsScore({ jd, resume: data.optimizedLatex });
    } catch (err) {
      console.error(err);
      setError(getErrorMessage(err, "Failed to optimize resume"));
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleDownload = () => {
    if (!pdfBase64) return;
    const byteCharacters = atob(pdfBase64);
    const byteNumbers = new Array(byteCharacters.length)
      .fill(0)
      .map((_, i) => byteCharacters.charCodeAt(i));
    const blob = new Blob([new Uint8Array(byteNumbers)], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "optimized-resume.pdf";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen pb-16 text-slate-900">
      <header className="mx-auto flex max-w-6xl flex-col gap-8 px-6 pt-12">
        <div className="flex items-center justify-between text-[0.65rem] font-semibold uppercase tracking-[0.4em] text-slate-500">
          <span>Resume Lab</span>
          <span>Work Mode</span>
        </div>
        <div className="mx-auto -rotate-2 rounded-full border-4 border-slate-900 bg-slate-900 px-6 py-2 text-xs font-black uppercase tracking-[0.4em] text-white shadow-[8px_8px_0_0_#06b6d4]">
          Software Development • Gen AI • Product Engineering
        </div>
        <h1 className="text-center text-5xl font-black tracking-[0.25em] text-slate-900 sm:text-7xl">RIZZUM</h1>
      </header>

      <section className="mx-auto mt-8 flex max-w-5xl flex-wrap items-center justify-center gap-4 px-6">
        <ScoreBadge coverage={atsScore?.coverage} />
        <button
          onClick={handleOptimize}
          disabled={isOptimizing}
          className="flex items-center gap-2 rounded-full border-4 border-slate-900 bg-yellow-300 px-8 py-3 text-sm font-black uppercase tracking-wide text-slate-900 shadow-[6px_6px_0_0_#0f172a] transition hover:-translate-y-1 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isOptimizing ? "Optimizing…" : "Optimize Resume"}
        </button>
      </section>
      {error && <p className="mt-3 text-center text-sm font-semibold text-rose-500">{error}</p>}

      <main className="mx-auto mt-12 grid max-w-6xl gap-6 px-6 lg:grid-cols-2">
        <div className="space-y-6">
          <Panel title="Job Description">
            <textarea
              className="h-48 w-full rounded-2xl border-4 border-slate-900/30 bg-slate-100 p-4 font-mono text-sm text-slate-900 outline-none transition focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-yellow-300"
              value={jd}
              onChange={(e) => setJd(e.target.value)}
            />
          </Panel>

          <Panel title="Original Resume LaTeX">
            <div className="rounded-[28px] border-4 border-slate-900 bg-white p-1 shadow-[6px_6px_0_0_#0f172a]">
              <Editor
                height="420px"
                defaultLanguage="latex"
                theme="vs"
                options={editorOptions}
                value={resume}
                onChange={(val) => setResume(val || "")}
              />
            </div>
          </Panel>

          <div className="flex justify-end">
            <button
              onClick={handleDownload}
              disabled={!pdfBase64 || isCompiling}
              className="flex items-center gap-2 rounded-full border-4 border-slate-900 bg-white px-8 py-3 text-sm font-black uppercase tracking-wide text-slate-900 shadow-[6px_6px_0_0_#0f172a] transition hover:-translate-y-1 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Download PDF
            </button>
          </div>
        </div>

        <div className="space-y-6">
          <Panel
            title="Live PDF Preview"
            actions={
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {isCompiling ? "Compiling…" : pdfBase64 ? "Up to date" : "Waiting for LaTeX"}
              </span>
            }
          >
            <div className="h-[420px] overflow-hidden rounded-[28px] border-4 border-slate-900 bg-slate-50 shadow-[6px_6px_0_0_#0f172a]">
              {pdfDataUrl ? (
                <iframe title="resume-preview" src={pdfDataUrl} className="h-full w-full" />
              ) : (
                <div className="flex h-full items-center justify-center text-slate-400">PDF preview pending</div>
              )}
            </div>
          </Panel>

          <Panel title="Optimized LaTeX">
            <div className="rounded-[28px] border-4 border-slate-900 bg-white p-1 shadow-[6px_6px_0_0_#0f172a]">
              <Editor
                height="360px"
                defaultLanguage="latex"
                theme="vs"
                options={editorOptions}
                value={optimizedLatex}
                onChange={(value) => setOptimizedLatex(value || "")}
              />
            </div>
          </Panel>

          {atsScore && (
            <Panel title="ATS Insights">
              <div className="space-y-4 text-sm text-slate-700">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.3em] text-slate-500">Top matched keywords</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {atsScore.matchedKeywords.map((keyword) => (
                      <span
                        key={keyword}
                        className="rounded-full border-2 border-slate-900/40 bg-emerald-200 px-3 py-1 font-semibold text-slate-900"
                      >
                        {keyword}
                      </span>
                    ))}
                    {!atsScore.matchedKeywords.length && <span className="text-slate-400">No matches yet</span>}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.3em] text-slate-500">High-priority gaps</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {atsScore.missingKeywords.map((keyword) => (
                      <span
                        key={keyword}
                        className="rounded-full border-2 border-slate-900/40 bg-rose-200 px-3 py-1 font-semibold text-slate-900"
                      >
                        {keyword}
                      </span>
                    ))}
                    {!atsScore.missingKeywords.length && <span className="text-slate-400">Fully covered!</span>}
                  </div>
                </div>
              </div>
            </Panel>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;

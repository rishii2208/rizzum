import { useCallback, useState } from "react";
import axios from "axios";
import Editor from "@monaco-editor/react";
import { Link, Navigate, Route, Routes } from "react-router-dom";
import { ScoreBadge } from "./components/ScoreBadge.tsx";
import { Panel } from "./components/Panel.tsx";
import { EmailPage } from "./pages/EmailPage.tsx";
import { fetchAtsScore, optimizeCoverLetter, optimizeResume } from "./lib/api.ts";
import type { AtsScore } from "./types.ts";

type ApiErrorResponse = { message?: string };

const DEFAULT_JD = `We need a Senior Software Engineer to build AI-powered developer tools.
Must have: React, TypeScript, Node.js, cloud (GCP/AWS) experience, and experience working with LLM APIs.
Nice to have: TailwindCSS, PDF generation, ATS integrations.`;

const DEFAULT_RESUME_LOCAL = String.raw`\documentclass[11pt,a4paper,sans]{moderncv}

\moderncvstyle{banking}
\moderncvcolor{black}

\usepackage[scale=0.85]{geometry}
\geometry{top=0.75in, bottom=0.75in, left=0.7in, right=0.7in}

\name{Rishi Raj}{Prajapati}
\phone[mobile]{870-016-8283}
\email{rishirajprajapati22@gmail.com}
\social[linkedin]{rishi-raj-prajapati}
\social[github]{rishii2208}

\begin{document}

\makecvtitle

\vspace{-20pt}

\section{Summary}
Full-stack engineer with production experience architecting scalable systems from zero to production serving 5M+ users. Specialized in high-performance APIs, distributed systems, and infrastructure optimization with proven impact on throughput and reliability. Strong foundation in microservices, containerization, and performance engineering across Node.js, Python, and Go.

\section{Skills}
\cvitem{Languages}{Python, JavaScript, TypeScript, Go, SQL, C++}
\cvitem{Frameworks/Libraries}{Node.js, FastAPI, Express.js, React.js, XGBoost, LSTM, WebRTC}
\cvitem{Cloud \& DevOps}{AWS (EC2, S3), Docker, Kubernetes, CI/CD, Redis, PostgreSQL, MongoDB, ChromaDB}
\cvitem{Tools \& Practices}{Git, k6, Linux, Agile, Microservices, RESTful APIs, System Design, Load Testing, Observability}

\section{Professional Experience}

\cventry{Jan 2025 -- Nov 2025}{Founding Software Engineer}{Fornix AI}{Remote}{}{
\begin{itemize}
\item Co-architected production-grade AI hiring platform from ground up, building backend systems with Node.js, Python, and Go handling 25K+ requests with p95 latency of 53ms and zero errors during k6 load testing
\item Engineered performance-critical architecture implementing async patterns, intelligent caching strategies, and comprehensive load validation ensuring fault tolerance and reliability under production-scale traffic
\item Owned full development lifecycle from requirements gathering through deployment automation and monitoring, shipping features iteratively while maintaining system observability and 99.9\% uptime
\end{itemize}
}

\cventry{Sep 2024 -- Dec 2024}{Software Engineering Intern}{AOC}{Remote, IN}{}{
\begin{itemize}
\item Architected 6 RESTful API endpoints using FastAPI and PostgreSQL serving 20K+ user records, achieving sub-100ms latency under concurrent load through async I/O optimization
\item Engineered authentication pipeline with JWT-based security and database schema migrations, improving system throughput by 25\% and enabling zero-downtime deployments
\item Implemented connection pooling and query optimization for horizontal scaling in production environments
\end{itemize}
}

\cventry{Mar 2024 -- Aug 2024}{Software Development Engineer Intern}{Zebpay}{Mumbai, India}{}{
\begin{itemize}
\item Developed real-time sentiment analysis feature processing 40K requests/day from Twitter and Telegram, building automated ETL pipeline for cryptocurrency market insights on platform with 5M+ active users
\item Designed ML-powered price prediction API using XGBoost and LSTM achieving 92\% accuracy with 900ms inference latency across major tokens, deployed in large-scale production codebase
\end{itemize}
}

\section{Projects}

\cventry{}{MindMapper -- AI-Powered Knowledge Mapping Platform}{\href{https://github.com/rishii2208/AIMindMapper}{github.com/rishii2208/AIMindMapper}}{}{}{
\begin{itemize}
\item Built full-stack application with React.js and FastAPI processing 8K+ documents serving 1K+ visits, implementing semantic search with OpenAI embeddings and ChromaDB vector database for cross-document insight linking
\item Containerized with Docker for consistent deployment across environments
\end{itemize}
}

\cventry{}{Slander -- P2P Real-Time Video Chat Platform}{\href{http://slander.live}{slander.live}}{}{}{
\begin{itemize}
\item Engineered WebRTC-based platform achieving 200ms latency, serving 800 DAU with 19-minute average sessions and 100+ streaming hours, including AI content moderation with 78\% accuracy
\item Optimized signaling server and TURN/STUN configuration for reliable NAT traversal and connection stability
\end{itemize}
}

\section{Education}

\cventry{Aug 2022 -- May 2026}{Bachelor of Technology in Electronics \& Communication Engineering}{Delhi Technological University}{Delhi, India}{}{Minor in Artificial Intelligence \& Machine Learning}

\section{Certifications \& Awards}

\begin{itemize}
\item Solved 300+ algorithmic problems on LeetCode (rating: 1570), demonstrating strong problem-solving capabilities
\item Joint Secretary at Invictus DTU: secured INR 30+ lakhs funding, organized 10+ events including 2 national hackathons with 1K+ attendees and 8 competitions with 300+ participants each
\item Won 3 national-level hackathons (5K+ registrations) and 7 regional hackathons (500+ participants)
\end{itemize}

\end{document}
`;

const DEFAULT_RESUME_REMOTE = String.raw`\documentclass[a4paper,11pt]{article}
\usepackage[utf8]{inputenc}
\usepackage[T1]{fontenc}
\usepackage{geometry}
\usepackage{enumitem}
\usepackage{hyperref}
\usepackage{fontawesome5}
\usepackage{xcolor}
\usepackage{titlesec}
\usepackage{fancyhdr}

% Page margins
\geometry{left=1.5cm, right=1.5cm, top=1.5cm, bottom=1.5cm}

% Define colors
\definecolor{linkblue}{RGB}{0, 0, 238}
\definecolor{lightblue}{RGB}{0, 79, 144}
\definecolor{textgray}{RGB}{64, 64, 64}

% Hyperlink setup
\hypersetup{
    colorlinks=true,
    linkcolor=linkblue,
    urlcolor=linkblue,
    citecolor=linkblue
}

% Section formatting
\titleformat{\section}
    {\large\bfseries}
    {}
    {0em}
    {}
    [\titlerule]

\titlespacing*{\section}{0pt}{10pt}{5pt}

% Remove page numbers
\pagestyle{empty}

% Decrease word spacing
\spaceskip=2.5pt plus 1pt minus 0.8pt

% Set description text size to 10pt
\newcommand{\descriptionsize}{\fontsize{10}{12}\selectfont}

% Custom list settings
\setlist[itemize]{leftmargin=*, itemsep=2pt, topsep=2pt, parsep=0pt, before=\descriptionsize, label=$\circ$}

\begin{document}

% Header
\begin{center}
    {\LARGE \textbf{Rishi Raj Prajapati}}\\[8pt]
    \faMapMarker\ Bangalore, India \quad
    \faEnvelope\ \href{mailto:rishirajprajapati22@gmail.com}{rishirajprajapati22@gmail.com} \quad
    \faPhone\ 870-016-8283 \quad
    \faLinkedin\ \href{https://linkedin.com/in/rishi-raj-prajapati/}{rishi-raj-prajapati} \quad
    \faGithub\ \href{https://github.com/rishii2208}{rishii2208}
\end{center}

% Education
\section*{Education}
\noindent\textbf{Delhi Technological University} \hfill \textit{Aug 2022 - May 2026}\\
\textit{BTech, Majors in ECE, Minors in AI-ML}

% Experience
\section*{Experience}
\noindent\textbf{Software Developer Intern} \hfill \textit{May 2025 -- Jul 2025}\\
\textcolor{lightblue}{\textit{AOC}} \href{https://www.addressofchoice.com/}{\textcolor{lightblue}{\faExternalLink*}}
\begin{itemize}
    \item Implemented a modular, user-friendly, responsive interface using \textcolor{linkblue}{React.js} with reusable components for design
    \item Improved a scalable, efficient back-end with \textcolor{linkblue}{Node.js}, ensuring high traffic handling and complex data processing
    \item Managed data storage and retrieval using \href{https://www.mongodb.com/}{\textcolor{linkblue}{MongoDB}} by eliminating N+1 query problems
    \item Worked on  a robust cloud infrastructure on \textcolor{linkblue}{AWS}, utilizing \textcolor{linkblue}{EC2} for scalable hosting and \textcolor{linkblue}{S3} for efficient media storage to ensure high availability
\end{itemize}

\noindent\textbf{Software Engineer Intern} \hfill \textit{Mar 2024 -- Aug 2024}\\
\textcolor{lightblue}{\textit{Zebpay}} \href{https://www.linkedin.com/company/zebpay/}{\textcolor{lightblue}{\faExternalLink*}}
\begin{itemize}
    \item Designed and engineered a scalable \textcolor{linkblue}{REST APIs} for real-time data processing for crypto price analysis, achieving low-latency inference
and high availability at scale, ensuring robust system performance.
    \item Worked on a secure, robust, scalable backend with \textcolor{linkblue}{Node.js} and \textcolor{linkblue}{Express.js}, ensuring reliable performance and data handling
    \item Integrated \href{https://www.mongodb.com/}{\textcolor{linkblue}{MongoDB}} for secure, efficient, scalable storage and retrieval of user registration details
    \item Integrated \textcolor{linkblue}{Email.js} to automate company emails, capturing and processing user inputs from the front-end
\end{itemize}

% Projects
\section*{Projects}

\noindent\textbf{Slander} \href{https://scholarsense-x98f.vercel.app/}{\textcolor{lightblue}{\faExternalLink*}}
\begin{itemize}
   \item Developed a real-time, anonymous networking platform for developers using \textcolor{linkblue}{Next.js} and \textcolor{linkblue}{WebRTC} to facilitate spontaneous peer-to-peer video connections and knowledge sharing. 
   \item Secured the communication channels by implementing client-side rate limiting, automated content moderation algorithms, and \textcolor{linkblue}{JWT} based OAuth to ensure a safe and verified community environment. 
   \item Engineered a low-latency signaling server with \textcolor{linkblue}{Socket.io} and \textcolor{linkblue}{TypeScript} to efficiently handle dynamic room allocation and instant user matching logic. 
   \item Enhanced user engagement through a high-performance UI built with \textcolor{linkblue}{Tailwind CSS} and \textcolor{linkblue}{GSAP}, implementing complex scroll-triggered animations and interactive 3D visual effects.
\end{itemize}

\noindent\textbf{MindMapper}
\begin{itemize}
    \item Created and implemented a scalable \textcolor{linkblue}{TCP}-based \href{https://github.com/rishii2208/AIMindMapper}{\textcolor{linkblue}{HTTP}} server-client architecture supporting multiple users
    \item Executed \textcolor{linkblue}{HTTP/1.1} features for file upload and download operations with efficient request handling mechanisms
    \item Added versatile file support for \textcolor{linkblue}{TXT}, \textcolor{linkblue}{HTML}, \textcolor{linkblue}{PDF}, \textcolor{linkblue}{JPEG}, and \textcolor{linkblue}{C} formats enhancing user convenience and adaptability
    \item Applied robust error handling and connection management to ensure reliable and efficient data transfer integrity
\end{itemize}


% Technologies
\section*{Technologies}
\noindent\textbf{Languages \& Frameworks:} C++, C, Python, SQL, JavaScript, HTML5, CSS, React.js, Node.js, Express.js, Tailwind CSS\\[3pt]
\textbf{Databases \& Tools:} MongoDB, PostgreSQL, MySQL, Git/GitHub, Postman, VS Code, AWS(EC2,S3), Docker, Linux
\textbf{Relevant Coursework:} Operating Systems, Computer Networks, Data Structures and Algorithms, Algorithm Analysis and Design, OOPS, DBMS, System Design



% Achievements
\section*{Achievements}
\begin{itemize}
    \item Worked with team/independently in over {\textcolor{linkblue}{50 projects}}, in domains like AI, web development, softwtare development, freelance work delivered successfully.  \href{https://github.com/rishii2208}{\textcolor{linkblue}{github}}
    \item Won 6 national level hackathons from 2022 to 2025, and organised 3 24 hour offline national hackathons. 
    \item Served as a Joint secretary at \href{https://www.linkedin.com/company/round-table-dtu/}{\textcolor{linkblue}{Roundtable}}, mentoring over 200 college students about sofwtare development. Worked as a coo-ordinator in ne of largest technical fest of northern India - \href{https://www.instagram.com/invictus_dtu/}{\textcolor{linkblue}{Invictus}}. 

\end{itemize}

\end{document}
`;

const DEFAULT_COVER_LETTER = `Rishi Raj Prajapati
Developer
rishirajprajapati22@gmail.com
+918700168283
https://github.com/rishii2208
https://www.linkedin.com/in/rishi-raj-prajapati/
https://rishii.vercel.app

[Date]

[Hiring Manager Name]
[Hiring Manager Title]
[Company Name]
[Company Address Line 1]
[City, State, ZIP Code]

Dear [Hiring Manager First Name]:

Having recently come across your job posting for a [Job Title] at [Company Name] and subsequently reading the job description, I knew I had to apply immediately. As a [City] local who has earned a master's degree in [Degree / Field] and worked for top companies in [Industry / Region], this role feels like a natural next step in my career.

Currently a Developer at AOC, I manage a variety of responsibilities that closely align with what your job description outlines. These include establishing secure cloud environments, ensuring system uptime, building, designing, and deploying complex SaaS-based applications, and handling production monitoring. With over 3 years of experience in engineering and cloud services, particularly with [Key Technologies / Tools mentioned in job description], I believe I would be well suited to take on the challenges of [role mentioned in JD] role.

At [Current Company], I played a key role in overhauling the bug tracking and ticketing system for the cloud engineering team. As a result, issues were identified approximately [Percentage]% earlier on average. Prior to that, I led a cross-functional team to expand internal REST and API usage, improving overall productivity by roughly [Percentage]%.

I would welcome the opportunity to speak with you and share more about how I can contribute to [Company Name]'s cloud initiatives. Thank you for your time and consideration. I look forward to your response.

Sincerely,
Rishi`;

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

type ResumeTemplate = "local" | "remote";

function ResumePage() {
  const [jd, setJd] = useState(DEFAULT_JD);
  const [selectedTemplate, setSelectedTemplate] = useState<ResumeTemplate>("local");
  const [resumeLocal, setResumeLocal] = useState(DEFAULT_RESUME_LOCAL);
  const [resumeRemote, setResumeRemote] = useState(DEFAULT_RESUME_REMOTE);
  const [optimizedLatex, setOptimizedLatex] = useState("");
  const [coverLetterTemplate, setCoverLetterTemplate] = useState(DEFAULT_COVER_LETTER);
  const [generatedCoverLetter, setGeneratedCoverLetter] = useState("");
  const [atsScore, setAtsScore] = useState<AtsScore | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isOptimizingWithCoverLetter, setIsOptimizingWithCoverLetter] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentResume = selectedTemplate === "local" ? resumeLocal : resumeRemote;

  const runAtsScore = useCallback(async (payload: { jd: string; resume: string }) => {
    try {
      const { data } = await fetchAtsScore(payload);
      setAtsScore(data);
    } catch (err) {
      console.error(err);
    }
  }, []);

  const handleOptimize = async () => {
    if (!jd.trim() || !currentResume.trim()) {
      setError("Both JD and resume LaTeX are required");
      return;
    }

    setIsOptimizing(true);
    setError(null);
    try {
      const { data } = await optimizeResume({ jd, resume: currentResume });
      setOptimizedLatex(data.optimizedLatex);
      await runAtsScore({ jd, resume: data.optimizedLatex });
    } catch (err) {
      console.error(err);
      setError(getErrorMessage(err, "Failed to optimize resume"));
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleOptimizeWithCoverLetter = async () => {
    if (!jd.trim() || !currentResume.trim() || !coverLetterTemplate.trim()) {
      setError("JD, resume LaTeX, and cover letter template are required");
      return;
    }

    setIsOptimizingWithCoverLetter(true);
    setError(null);
    try {
      // Optimize resume
      const resumeResponse = await optimizeResume({ jd, resume: currentResume });
      setOptimizedLatex(resumeResponse.data.optimizedLatex);
      
      // Generate cover letter
      const coverLetterResponse = await optimizeCoverLetter({ jd, template: coverLetterTemplate });
      setGeneratedCoverLetter(coverLetterResponse.data.coverLetter);
      
      // Get ATS score
      await runAtsScore({ jd, resume: resumeResponse.data.optimizedLatex });
    } catch (err) {
      console.error(err);
      setError(getErrorMessage(err, "Failed to optimize resume and cover letter"));
    } finally {
      setIsOptimizingWithCoverLetter(false);
    }
  };

  return (
    <div className="min-h-screen pb-16 text-slate-900">
      <header className="border-b-4 border-slate-900 bg-white/90 px-6 py-8 shadow-[0_12px_0_0_#0f172a]">
        <div className="mx-auto flex max-w-7xl flex-col gap-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-600">Resume Editor</p>
              <h1 className="mt-2 text-3xl font-black text-slate-900">Tailor your LaTeX resume with AI</h1>
            </div>
            <nav className="flex flex-wrap items-center gap-2 text-sm font-semibold">
              <span className="rounded-full bg-slate-900 px-3 py-1 text-white shadow-[4px_4px_0_0_#0f172a]">Resume</span>
              <Link
                to="/email-optimise"
                className="rounded-full border-2 border-slate-900 bg-white px-3 py-1 text-slate-900 shadow-[4px_4px_0_0_#0f172a] transition hover:-translate-y-0.5 hover:bg-slate-100"
              >
                Email Optimizer
              </Link>
            </nav>
          </div>
          {error && <p className="text-sm font-semibold text-rose-600">{error}</p>}
        </div>
      </header>

      <main className="mx-auto mt-10 flex max-w-7xl flex-col gap-6 px-6">
        <Panel title="Job Description">
          <textarea
            className="h-40 w-full rounded-2xl border-4 border-slate-900/30 bg-slate-100 p-4 font-mono text-sm text-slate-900 outline-none transition focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-yellow-300"
            value={jd}
            onChange={(e) => setJd(e.target.value)}
          />
        </Panel>

        <Panel title="Select Resume Template">
          <div className="flex gap-6">
            <label className="flex cursor-pointer items-center gap-3">
              <input
                type="radio"
                name="template"
                value="local"
                checked={selectedTemplate === "local"}
                onChange={(e) => setSelectedTemplate(e.target.value as ResumeTemplate)}
                className="h-5 w-5 cursor-pointer accent-slate-900"
              />
              <span className="font-semibold text-slate-900">Original Remote</span>
            </label>
            <label className="flex cursor-pointer items-center gap-3">
              <input
                type="radio"
                name="template"
                value="remote"
                checked={selectedTemplate === "remote"}
                onChange={(e) => setSelectedTemplate(e.target.value as ResumeTemplate)}
                className="h-5 w-5 cursor-pointer accent-slate-900"
              />
              <span className="font-semibold text-slate-900">Original Local</span>
            </label>
          </div>
        </Panel>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Panel title={selectedTemplate === "local" ? "Original Resume LaTeX (Local)" : "Original Resume LaTeX (Remote)"}>
            <div className="rounded-[28px] border-4 border-slate-900 bg-white p-1 shadow-[6px_6px_0_0_#0f172a]">
              <Editor
                height="500px"
                defaultLanguage="latex"
                theme="vs"
                options={editorOptions}
                value={currentResume}
                onChange={(val) =>
                  selectedTemplate === "local" ? setResumeLocal(val || "") : setResumeRemote(val || "")
                }
              />
            </div>
          </Panel>

          <Panel title="Optimized LaTeX Code Output">
            <div className="rounded-[28px] border-4 border-slate-900 bg-white p-1 shadow-[6px_6px_0_0_#0f172a]">
              {optimizedLatex ? (
                <Editor
                  height="500px"
                  defaultLanguage="latex"
                  theme="vs"
                  options={{ ...editorOptions, readOnly: false }}
                  value={optimizedLatex}
                  onChange={(value) => setOptimizedLatex(value || "")}
                />
              ) : (
                <div className="flex h-[500px] items-center justify-center text-slate-400">
                  <p className="text-center">
                    Click "Optimize Resume" to generate
                    <br />
                    optimized LaTeX code
                  </p>
                </div>
              )}
            </div>
          </Panel>
        </div>

        <div className="flex items-center justify-center gap-4">
          <ScoreBadge coverage={atsScore?.coverage} />
          <button
            onClick={handleOptimize}
            disabled={isOptimizing || isOptimizingWithCoverLetter}
            className="flex items-center gap-2 rounded-full border-4 border-slate-900 bg-yellow-300 px-8 py-3 text-sm font-black uppercase tracking-wide text-slate-900 shadow-[6px_6px_0_0_#0f172a] transition hover:-translate-y-1 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isOptimizing ? "Optimizing…" : "Optimize Resume"}
          </button>
          <button
            onClick={handleOptimizeWithCoverLetter}
            disabled={isOptimizing || isOptimizingWithCoverLetter}
            className="flex items-center gap-2 rounded-full border-4 border-slate-900 bg-emerald-400 px-8 py-3 text-sm font-black uppercase tracking-wide text-slate-900 shadow-[6px_6px_0_0_#0f172a] transition hover:-translate-y-1 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isOptimizingWithCoverLetter ? "Generating…" : "Optimize + Cover Letter"}
          </button>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Panel title="Cover Letter Preview">
            <div className="rounded-[28px] border-4 border-slate-900 bg-white p-1 shadow-[6px_6px_0_0_#0f172a]">
              <textarea
                className="h-[400px] w-full resize-none rounded-[24px] border-0 p-4 font-mono text-sm text-slate-900 outline-none focus:ring-2 focus:ring-yellow-300"
                value={coverLetterTemplate}
                onChange={(e) => setCoverLetterTemplate(e.target.value)}
              />
            </div>
          </Panel>

          <Panel title="Generated Cover Letter">
            <div className="rounded-[28px] border-4 border-slate-900 bg-white p-1 shadow-[6px_6px_0_0_#0f172a]">
              {generatedCoverLetter ? (
                <textarea
                  className="h-[400px] w-full resize-none rounded-[24px] border-0 p-4 font-mono text-sm text-slate-900 outline-none focus:ring-2 focus:ring-emerald-300"
                  value={generatedCoverLetter}
                  onChange={(e) => setGeneratedCoverLetter(e.target.value)}
                />
              ) : (
                <div className="flex h-[400px] items-center justify-center text-slate-400">
                  <p className="text-center">
                    Click "Optimize + Cover Letter" to generate
                    <br />
                    a personalized cover letter
                  </p>
                </div>
              )}
            </div>
          </Panel>
        </div>

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
      </main>
    </div>
  );
}

export { ResumePage };

function App() {
  return (
    <Routes>
      <Route path="/" element={<ResumePage />} />
      <Route path="/email" element={<EmailPage />} />
      <Route path="/email-optimize" element={<EmailPage />} />
      <Route path="/email-optimise" element={<EmailPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;

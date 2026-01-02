import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import Editor from "@monaco-editor/react";
import { Link, Navigate, Route, Routes } from "react-router-dom";
import { ScoreBadge } from "./components/ScoreBadge.tsx";
import { Panel } from "./components/Panel.tsx";
import { EmailPage } from "./pages/EmailPage.tsx";
import { useDebounce } from "./hooks/useDebounce.ts";
import { compileLatex, fetchAtsScore, optimizeResume } from "./lib/api.ts";
import type { AtsScore } from "./types.ts";

type ApiErrorResponse = { message?: string };

const DEFAULT_JD = `We need a Senior Software Engineer to build AI-powered developer tools.
Must have: React, TypeScript, Node.js, cloud (GCP/AWS) experience, and experience working with LLM APIs.
Nice to have: TailwindCSS, PDF generation, ATS integrations.`;

const DEFAULT_RESUME = String.raw`\documentclass[11pt,a4paper,sans]{moderncv}

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

const editorOptions = {
  fontSize: 14,
  minimap: { enabled: false },
  scrollBeyondLastLine: false,
  wordWrap: "on",
  automaticLayout: true
} as const;

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);
const PREVIEW_HEIGHT_MIN = 280;
const PREVIEW_HEIGHT_MAX = 900;
const PREVIEW_WIDTH_MIN = 320;
const PREVIEW_WIDTH_MAX = 720;

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

function ResumePage() {
  const [jd, setJd] = useState(DEFAULT_JD);
  const [resume, setResume] = useState(DEFAULT_RESUME);
  const [optimizedLatex, setOptimizedLatex] = useState(DEFAULT_RESUME);
  const [pdfBase64, setPdfBase64] = useState<string>("");
  const [atsScore, setAtsScore] = useState<AtsScore | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isCompiling, setIsCompiling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewHeight, setPreviewHeight] = useState(520);
  const [isResizingPreview, setIsResizingPreview] = useState(false);
  const previewResizeState = useRef<{ startY: number; startHeight: number }>({ startY: 0, startHeight: 520 });
  const previewHeightRef = useRef(previewHeight);
  const [previewWidth, setPreviewWidth] = useState(420);
  const [isResizingPreviewWidth, setIsResizingPreviewWidth] = useState(false);
  const previewWidthState = useRef<{ startX: number; startWidth: number }>({ startX: 0, startWidth: 420 });
  const previewWidthRef = useRef(previewWidth);
  const [isDesktop, setIsDesktop] = useState(false);
  const [pdfObjectUrl, setPdfObjectUrl] = useState<string | null>(null);
  const [isFullPreviewOpen, setIsFullPreviewOpen] = useState(false);

  const debouncedLatex = useDebounce(optimizedLatex, 800);

  const pdfDataUrl = useMemo(() => (pdfBase64 ? `data:application/pdf;base64,${pdfBase64}` : null), [pdfBase64]);
  const pdfDisplaySrc = pdfObjectUrl ?? pdfDataUrl;

  useEffect(() => {
    previewHeightRef.current = previewHeight;
  }, [previewHeight]);

  useEffect(() => {
    previewWidthRef.current = previewWidth;
  }, [previewWidth]);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 1024px)");
    const update = () => setIsDesktop(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (!pdfBase64) {
      setPdfObjectUrl(null);
      return;
    }

    try {
      const byteCharacters = atob(pdfBase64);
      const byteNumbers = new Uint8Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i += 1) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const blob = new Blob([byteNumbers], { type: "application/pdf" });
      const baseUrl = URL.createObjectURL(blob);
      const zoomedUrl = `${baseUrl}#zoom=page-width`;
      setPdfObjectUrl(zoomedUrl);

      return () => {
        URL.revokeObjectURL(baseUrl);
      };
    } catch (err) {
      console.error("Failed to build PDF preview URL", err);
      setPdfObjectUrl(null);
    }
  }, [pdfBase64]);

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

  useEffect(() => {
    if (!isResizingPreview) return;

    const handleMove = (event: MouseEvent | TouchEvent) => {
      const clientY = "touches" in event ? event.touches[0]?.clientY : event.clientY;
      if (typeof clientY !== "number") return;
      event.preventDefault();
      const { startY, startHeight } =
        previewResizeState.current ?? { startY: clientY, startHeight: previewHeightRef.current };
      const delta = clientY - startY;
      const nextHeight = clamp(startHeight + delta, PREVIEW_HEIGHT_MIN, PREVIEW_HEIGHT_MAX);
      setPreviewHeight(nextHeight);
    };

    const stop = () => setIsResizingPreview(false);

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("touchmove", handleMove, { passive: false });
    window.addEventListener("mouseup", stop);
    window.addEventListener("touchend", stop);
    window.addEventListener("touchcancel", stop);

    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("touchmove", handleMove);
      window.removeEventListener("mouseup", stop);
      window.removeEventListener("touchend", stop);
      window.removeEventListener("touchcancel", stop);
    };
  }, [isResizingPreview]);

  useEffect(() => {
    if (!isResizingPreviewWidth) return;

    const handleMove = (event: MouseEvent | TouchEvent) => {
      const clientX = "touches" in event ? event.touches[0]?.clientX : event.clientX;
      if (typeof clientX !== "number") return;
      event.preventDefault();
      const { startX, startWidth } = previewWidthState.current ?? {
        startX: clientX,
        startWidth: previewWidthRef.current
      };
      const delta = clientX - startX;
      const nextWidth = clamp(startWidth + delta, PREVIEW_WIDTH_MIN, PREVIEW_WIDTH_MAX);
      setPreviewWidth(nextWidth);
    };

    const stop = () => setIsResizingPreviewWidth(false);

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("touchmove", handleMove, { passive: false });
    window.addEventListener("mouseup", stop);
    window.addEventListener("touchend", stop);
    window.addEventListener("touchcancel", stop);

    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("touchmove", handleMove);
      window.removeEventListener("mouseup", stop);
      window.removeEventListener("touchend", stop);
      window.removeEventListener("touchcancel", stop);
    };
  }, [isResizingPreviewWidth]);

  useEffect(() => {
    if (!isFullPreviewOpen) return;

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsFullPreviewOpen(false);
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isFullPreviewOpen]);

  const runAtsScore = useCallback(async (payload: { jd: string; resume: string }) => {
    try {
      const { data } = await fetchAtsScore(payload);
      setAtsScore(data);
    } catch (err) {
      console.error(err);
    }
  }, []);

  const beginPreviewResize = (clientY: number) => {
    previewResizeState.current = { startY: clientY, startHeight: previewHeightRef.current };
    setIsResizingPreview(true);
  };

  const handlePreviewResizeStart = (
    event: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>
  ) => {
    const clientY = "touches" in event ? event.touches[0]?.clientY : event.clientY;
    if (typeof clientY !== "number") return;
    event.preventDefault();
    beginPreviewResize(clientY);
  };

  const beginPreviewWidthResize = (clientX: number) => {
    previewWidthState.current = { startX: clientX, startWidth: previewWidthRef.current };
    setIsResizingPreviewWidth(true);
  };

  const handlePreviewWidthResizeStart = (
    event: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>
  ) => {
    const clientX = "touches" in event ? event.touches[0]?.clientX : event.clientX;
    if (typeof clientX !== "number") return;
    event.preventDefault();
    beginPreviewWidthResize(clientX);
  };

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

  const closeFullPreview = () => setIsFullPreviewOpen(false);

  return (
    <div className="min-h-screen pb-16 text-slate-900">
      <header className="border-b-4 border-slate-900 bg-white/90 px-6 py-8 shadow-[0_12px_0_0_#0f172a]">
        <div className="mx-auto flex max-w-6xl flex-col gap-4">
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

      <main className="mx-auto mt-10 flex max-w-6xl flex-col gap-6 px-6 lg:flex-row lg:items-stretch">
        <div className="flex w-full flex-col gap-6" style={{ flex: 1, minWidth: 0 }}>
          <Panel title="Job Description">
            <textarea
              className="h-40 w-full rounded-2xl border-4 border-slate-900/30 bg-slate-100 p-4 font-mono text-sm text-slate-900 outline-none transition focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-yellow-300"
              value={jd}
              onChange={(e) => setJd(e.target.value)}
            />
          </Panel>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <Panel title="Original Resume LaTeX">
              <div className="rounded-[28px] border-4 border-slate-900 bg-white p-1 shadow-[6px_6px_0_0_#0f172a]">
                <Editor
                  height="300px"
                  defaultLanguage="latex"
                  theme="vs"
                  options={editorOptions}
                  value={resume}
                  onChange={(val) => setResume(val || "")}
                />
              </div>
            </Panel>

            <Panel title="Optimized LaTeX">
              <div className="rounded-[28px] border-4 border-slate-900 bg-white p-1 shadow-[6px_6px_0_0_#0f172a]">
                <Editor
                  height="300px"
                  defaultLanguage="latex"
                  theme="vs"
                  options={editorOptions}
                  value={optimizedLatex}
                  onChange={(value) => setOptimizedLatex(value || "")}
                />
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
        </div>

        <div className="hidden lg:flex flex-col items-center justify-center px-2">
          <div
            role="separator"
            aria-label="Resize workspace"
            onMouseDown={handlePreviewWidthResizeStart}
            onTouchStart={handlePreviewWidthResizeStart}
            className="flex h-full cursor-col-resize select-none items-center"
          >
            <span className="h-40 w-1 rounded-full bg-slate-300" />
          </div>
        </div>

        <div
          className="flex w-full flex-col gap-6 lg:w-auto"
          style={{
            width: isDesktop ? previewWidth : "100%",
            maxWidth: isDesktop ? previewWidth : "100%",
            flexBasis: isDesktop ? previewWidth : "auto"
          }}
        >
          <Panel
            title="Live PDF Preview"
            actions={
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {isCompiling ? "Compiling…" : pdfBase64 ? "Up to date" : "Waiting for LaTeX"}
              </span>
            }
          >
            <div
              className="overflow-hidden rounded-[28px] border-4 border-slate-900 bg-slate-50 shadow-[6px_6px_0_0_#0f172a]"
              style={{ height: previewHeight }}
            >
              {pdfDisplaySrc ? (
                <iframe title="resume-preview" src={pdfDisplaySrc} className="h-full w-full" />
              ) : (
                <div className="flex h-full items-center justify-center text-slate-400">PDF preview pending</div>
              )}
            </div>
            <div
              role="separator"
              aria-label="Resize preview"
              onMouseDown={handlePreviewResizeStart}
              onTouchStart={handlePreviewResizeStart}
              className="flex cursor-row-resize select-none items-center justify-center py-2"
            >
              <span className="h-1 w-20 rounded-full bg-slate-300 transition-colors" />
            </div>
            <div className="flex items-center justify-between text-xs text-slate-400">
              <p>Drag handles to resize</p>
              <button
                type="button"
                onClick={() => pdfDisplaySrc && setIsFullPreviewOpen(true)}
                disabled={!pdfDisplaySrc}
                aria-label="Open full preview"
                className="flex items-center justify-center rounded-full border border-slate-900/30 bg-white/70 p-2 text-slate-700 shadow-sm transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <svg
                  className="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <circle cx="11" cy="11" r="7" />
                  <line x1="16.65" y1="16.65" x2="21" y2="21" />
                </svg>
              </button>
            </div>
          </Panel>

          <div className="flex items-center justify-center gap-4">
            <ScoreBadge coverage={atsScore?.coverage} />
            <button
              onClick={handleOptimize}
              disabled={isOptimizing}
              className="flex items-center gap-2 rounded-full border-4 border-slate-900 bg-yellow-300 px-8 py-3 text-sm font-black uppercase tracking-wide text-slate-900 shadow-[6px_6px_0_0_#0f172a] transition hover:-translate-y-1 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isOptimizing ? "Optimizing…" : "Optimize Resume"}
            </button>
          </div>
        </div>
      </main>

      {isFullPreviewOpen && pdfDisplaySrc && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              closeFullPreview();
            }
          }}
        >
          <div className="flex h-full w-full items-center justify-center p-4">
            <div className="relative flex h-full w-full max-w-6xl flex-col rounded-3xl border-4 border-white/30 bg-white">
              <button
                type="button"
                onClick={closeFullPreview}
                className="absolute right-4 top-4 rounded-full border border-slate-300 bg-white/80 px-3 py-1 text-sm font-semibold text-slate-600 shadow"
              >
                Close
              </button>
              <iframe title="full-resume-preview" src={pdfDisplaySrc} className="h-full w-full rounded-3xl" />
            </div>
          </div>
        </div>
      )}
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

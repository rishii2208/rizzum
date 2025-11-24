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

const DEFAULT_RESUME = `\\documentclass[11pt]{article}
\\usepackage{geometry}
\\geometry{margin=1in}
\\begin{document}
\\begin{center}
  {\\LARGE Jane Doe} \\\\ 
  {Software Engineer \\ jane@example.com \\ github.com/janedoe}
\\end{center}

\\section*{Summary}
Product-minded engineer with 6+ years building delightful SaaS products and leading cross-functional initiatives.

\\section*{Experience}
\\textbf{Lead Frontend Engineer} \\ Acme Corp \\ 2021--Present\\\\
\\begin{itemize}
  \\item Shipped React/TypeScript design system adopted by 8 teams and cut UI defects by 35%.
  \\item Drove performance optimizations that reduced bundle size by 28%.
  \\item Partnered with product to launch AI-assisted authoring features, lifting activation 12%.
\\end{itemize}

\\textbf{Software Engineer} \\ Northwind \\ 2018--2021\\\\
\\begin{itemize}
  \\item Built Node.js microservices powering analytics pipeline handling 2B events/day.
  \\item Mentored 4 engineers and instituted automated testing with 85% coverage.
\\end{itemize}

\\section*{Skills}
React \\ TypeScript \\ Node.js \\ GraphQL \\ GCP \\ AWS \\ TailwindCSS \\ Jest
\\end{document}`;

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
  <section className="space-y-3 rounded-2xl border border-white/10 bg-slate-900/70 p-4 shadow-2xl shadow-pink/40">
    <div className="flex items-center justify-between gap-3">
      <h2 className="text-lg font-semibold text-white">{title}</h2>
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
    <div className="min-h-screen bg-slate-950 pb-12 text-slate-50">
      <header className="space-y-3 border-b border-white/10 bg-slate-950/90 px-6 py-8 backdrop-blur">
        <p className="text-sm uppercase tracking-[0.3em] text-white/50">Resume Editor</p>
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <h1 className="text-3xl font-bold text-white">Tailor your LaTeX resume with AI</h1>
          <div className="flex items-center gap-3">
            <ScoreBadge coverage={atsScore?.coverage} />
            <button
              onClick={handleOptimize}
              disabled={isOptimizing}
              className="flex items-center gap-2 rounded-full bg-white/10 px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isOptimizing ? "Optimizing…" : "Optimize Resume"}
            </button>
          </div>
        </div>
        {error && <p className="text-sm text-rose-400">{error}</p>}
      </header>

      <main className="grid gap-6 p-6 lg:grid-cols-2">
        <div className="space-y-6">
          <Panel title="Job Description">
            <textarea
              className="h-48 w-full rounded-lg border border-white/10 bg-slate-900/80 p-3 font-mono text-sm text-slate-200 outline-none focus:border-orange-400"
              value={jd}
              onChange={(e) => setJd(e.target.value)}
            />
          </Panel>

          <Panel title="Original Resume LaTeX">
            <div className="rounded-md bg-white p-1">
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
              className="flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Download PDF
            </button>
          </div>
        </div>

        <div className="space-y-6">
          <Panel
            title="Live PDF Preview"
            actions={
              <span className="text-xs text-white/60">
                {isCompiling ? "Compiling…" : pdfBase64 ? "Up to date" : "Waiting for LaTeX"}
              </span>
            }
          >
            <div className="h-[420px] overflow-hidden rounded-xl border border-slate-700 bg-slate-900">
              {pdfDataUrl ? (
                <iframe title="resume-preview" src={pdfDataUrl} className="h-full w-full" />
              ) : (
                <div className="flex h-full items-center justify-center text-white/40">PDF preview pending</div>
              )}
            </div>
          </Panel>

          <Panel title="Optimized LaTeX">
            <div className="rounded-md bg-white p-1">
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
              <div className="space-y-4 text-sm text-white/80">
                <div>
                  <p className="text-xs uppercase tracking-wide text-white/60">Top matched keywords</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {atsScore.matchedKeywords.map((keyword) => (
                      <span key={keyword} className="rounded-full bg-emerald-500/10 px-3 py-1 text-emerald-300">
                        {keyword}
                      </span>
                    ))}
                    {!atsScore.matchedKeywords.length && <span className="text-white/40">No matches yet</span>}
                  </div>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-white/60">High-priority gaps</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {atsScore.missingKeywords.map((keyword) => (
                      <span key={keyword} className="rounded-full bg-rose-500/10 px-3 py-1 text-rose-300">
                        {keyword}
                      </span>
                    ))}
                    {!atsScore.missingKeywords.length && <span className="text-white/40">Fully covered!</span>}
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

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

const DEFAULT_RESUME_REMOTE = String.raw`\documentclass[letterpaper,11pt]{article}

\usepackage{latexsym}
\usepackage[empty]{fullpage}
\usepackage{titlesec}
\usepackage{marvosym}
\usepackage[usenames,dvipsnames]{color}
\usepackage{verbatim}
\usepackage{enumitem}
\usepackage[hidelinks]{hyperref}
\usepackage{fancyhdr}
\usepackage[english]{babel}
\usepackage{tabularx}
\usepackage{fontawesome5}
\usepackage{multicol}
\setlength{\multicolsep}{-3.0pt}
\setlength{\columnsep}{-1pt}
\input{glyphtounicode}

\pagestyle{fancy}
\fancyhf{}
\fancyfoot{}
\renewcommand{\headrulewidth}{0pt}
\renewcommand{\footrulewidth}{0pt}

\addtolength{\oddsidemargin}{-0.6in}
\addtolength{\evensidemargin}{-0.5in}
\addtolength{\textwidth}{1.19in}
\addtolength{\topmargin}{-.9in}
\addtolength{\textheight}{1.6in}

\urlstyle{same}

\raggedbottom
\raggedright
\setlength{\tabcolsep}{0in}

\titleformat{\section}{
  \vspace{-6pt}\scshape\raggedright\large\bfseries
}{}{0em}{}[\color{black}\titlerule \vspace{-6pt}]

\pdfgentounicode=1

\newcommand{\resumeItem}[1]{
  \item\small{
    {#1 \vspace{-3pt}}
  }
}

\newcommand{\resumeSubheading}[4]{
  \vspace{-3pt}\item
    \begin{tabular*}{1.0\textwidth}[t]{l@{\extracolsep{\fill}}r}
      \textbf{#1} & \textbf{\small #2} \\
      \textit{\small#3} & \textit{\small #4} \\
    \end{tabular*}\vspace{-8pt}
}

\newcommand{\resumeSubSubheading}[2]{
    \item
    \begin{tabular*}{0.97\textwidth}{l@{\extracolsep{\fill}}r}
      \textit{\small#1} & \textit{\small #2} \\
    \end{tabular*}\vspace{-7pt}
}

\newcommand{\resumeProjectHeading}[2]{
    \item
    \begin{tabular*}{1.001\textwidth}{l@{\extracolsep{\fill}}r}
      \small#1 & \textbf{\small #2}\\
    \end{tabular*}\vspace{-8pt}
}

\newcommand{\resumeSubItem}[1]{\resumeItem{#1}\vspace{-4pt}}

\renewcommand\labelitemi{$\vcenter{\hbox{\tiny$\bullet$}}$}
\renewcommand\labelitemii{$\vcenter{\hbox{\tiny$\bullet$}}$}

\newcommand{\resumeSubHeadingListStart}{\begin{itemize}[leftmargin=0.0in, label={}]}
\newcommand{\resumeSubHeadingListEnd}{\end{itemize}}
\newcommand{\resumeItemListStart}{\begin{itemize}}
\newcommand{\resumeItemListEnd}{\end{itemize}\vspace{-7pt}}

\newcommand{\whitetext}[1]{{\color{white}#1}}

\begin{document}

% ----------HEADING----------
\begin{center}
    {\Huge \scshape Rishi Raj Prajapati} \\ \vspace{1pt}
    \small \raisebox{-0.1\height}\faPhone\ +91-8700168283 ~ 
    \href{mailto:rishirajprajapati22@gmail.com}{\raisebox{-0.2\height}\faEnvelope\ \underline{rishirajprajapati22@gmail.com}} ~ 
    \href{https://linkedin.com/in/rishi-raj-prajapati/}{\raisebox{-0.2\height}\faLinkedin\ \underline{linkedin.com/in/rishi-raj-prajapati}}  ~
    \href{https://github.com/rishii2208}{\raisebox{-0.2\height}\faGithub\ \underline{github.com/rishii2208}}
    \vspace{-10pt}
\end{center}

% -----------EDUCATION-----------
\section{Education}
  \resumeSubHeadingListStart
    \resumeSubheading
      {Bachelor of Technology}{2022 -- 2026}
      {Delhi Technological University (DTU), Delhi}{}
  \resumeSubHeadingListEnd

% -----------EXPERIENCE-----------
\section{Experience}
  \resumeSubHeadingListStart

    \resumeSubheading
      {Software Developer (Backend)}{June - August 2025}
      {AOC | Noida, India}{}
      \resumeItemListStart
        \resumeItem{Designed, developed, and maintained scalable backend systems and RESTful APIs, focusing on secure data handling and robust integration patterns.}
        \resumeItem{Implemented secure RESTful APIs for user authentication, management, and efficient data processing, contributing to end-to-end data flow.}
        \resumeItem{Optimized data storage and retrieval using MongoDB, ensuring reliable data persistence for backend services.}
        \resumeItem{Collaborated effectively with cross-functional teams to deliver integrated software solutions, focusing on system reliability and documentation.}
      \resumeItemListEnd

    \resumeSubheading
      {Software Developer Intern}{March 2024 - July 2024}
      {Zebpay}{}
      \resumeItemListStart
        \resumeItem{Engineered highly scalable server-side REST APIs using Django Rest Framework, capable of handling high throughput (500+ requests/second) for critical data services.}
        \resumeItem{Optimized PostgreSQL database schemas and query performance by 40\% through advanced indexing and data modeling techniques, crucial for data warehousing.}
        \resumeItem{Automated deployments on AWS (EC2, S3, CloudFront) with CI/CD workflows, demonstrating expertise in infrastructure as code and efficient release management.}
      \resumeItemListEnd

  \resumeSubHeadingListEnd

% -----------PROJECTS-----------
\section{Projects}
    \resumeSubHeadingListStart
    
      \resumeProjectHeading
          {\textbf{Slander – P2P Real-Time Video Chat Platform} $|$ \emph{NextJS, ExpressJS, Python, Django, PostgreSQL, OAuth 2.0} $|$ \href{http://slander.live/}{\underline{Link}}}{}
          \resumeItemListStart
            \resumeItem{Engineered a full-stack, real-time video chat platform with robust backend infrastructure and secure user interactions, emphasizing data security.}
            \resumeItem{Developed responsive web UIs with Django and NextJS, implementing secure authentication flows and granular permission management using OAuth 2.0 principles.}
            \resumeItem{Implemented real-time data streaming and robust backend services, ensuring seamless user experience and reliable data synchronization.}
            \resumeItem{Designed and implemented secure user authentication and authorization mechanisms, including OAuth 2.0 flows for secure access and integration.}
          \resumeItemListEnd
          
      \resumeProjectHeading
          {\textbf{EasyAlgo Dynamic Website} $|$ \emph{CSS, HTML, Django, PostgreSQL, JavaScript, Python} $|$ \href{https://github.com}{\underline{GitHub}}}{May 2023 - June 2023}
          \resumeItemListStart
            \resumeItem{Developed an interactive learning platform, utilizing Django and PostgreSQL for robust data management, content delivery, and schema evolution.}
            \resumeItem{Managed project lifecycle from planning to execution, coordinating content creation and feature integration to ensure timely delivery and stakeholder alignment.}
            \resumeItem{Implemented data models and database schemas for tutorials and quizzes, facilitating efficient content updates and user progress tracking.}
            \resumeItem{Integrated user engagement features (likes, comments) with a focus on capturing and analyzing interaction data, supporting compliance considerations and metadata management.}
          \resumeItemListEnd
          
    \resumeSubHeadingListEnd

% -----------TECHNICAL SKILLS-----------
\section{Technical Skills}
 \begin{itemize}[leftmargin=0.15in, label={}]
    \small{\item{
     \textbf{Languages:}{ Python (preferred), JavaScript, SQL, PowerShell, HTML} \\
     \textbf{Frameworks \& Libraries:}{ Node.js, Express.js, Django, REST APIs, Microsoft Graph SDKs, Graph Explorer/Postman, Bootstrap} \\
     \textbf{Tools \& Platforms:}{ Git, GitHub, Azure DevOps, VS Code, Linux CLI, Docker, AWS (EC2, S3, RDS), Azure Services (Functions, Logic Apps, Data Factory, Storage)} \\
     \textbf{Databases:}{ PostgreSQL, MongoDB, SQL (data modeling, schema evolution, metadata, data lineage)} \\
     \textbf{Core Concepts:}{ Data Structures \& Algorithms, Backend Development, API Development (Microsoft Graph API), System Design, M365 Data Extraction \& Integration, ETL Pipelines, OAuth 2.0, Azure AD App Registrations, Least-privilege Permissions, Conditional Access, Data Modeling, Schema Evolution, Metadata Management, Data Lineage, M365 Security & Compliance (Data Residency, Retention, MIP Sensitivity Labels, DLP, eDiscovery, Auditing), Throttling, Pagination, Delta Sync, Change Tracking, Idempotent Upserts, Webhooks/Subscriptions, CI/CD (GitHub Actions, Azure DevOps), Containerization (Docker), Infrastructure as Code (IaC), Performance Tuning (rate-limit strategy, parallelization, backoff)} \\
     \textbf{Soft Skills:}{ Critical Thinking, Problem Solving, Excellent Communication, Collaboration, Documentation, Attention to Detail, Self-starter, Independent Operation}
    }}
 \end{itemize}

% -----------ACHIEVEMENTS-----------
\section{Achievements and Position of Responsibilities}
    \resumeSubHeadingListStart
        \resumeProjectHeading
          {\textbf{Main Coordinator, Roundtable DTU } $|$ Delhi}{Led and organized CTFs and cybersecurity workshops}
        \resumeProjectHeading
          {\textbf{CTF Event Coordinator,Invictus DTU }}{Led and organized hacking challenges at DTU's annual tech fest.}
          
    \resumeSubHeadingListEnd

\whitetext{
### Job Description
You will lead discovery, design secure app permissions, build reliable extract/transform/load pipelines, and deliver production-ready integrations with documentation and handoff. Seeking a hands-on SME who can scope, plan, and execute the end-to-end extraction of Microsoft 365 data via Microsoft Graph (and related APIs) and integrate it into a proprietary data warehousing system.
Responsibilities
• Discovery and Planning
• Conduct stakeholder interviews and data inventory across M365 workloads (SharePoint Online, OneDrive, Teams, Exchange Online, Entra ID/Azure AD).
• Define scope, data models, mapping, and success criteria; produce a project plan with milestones, risks, and estimates.
• Architecture and Security
• Design the extraction architecture using Microsoft Graph and related services (Graph SDKs, delta queries, subscriptions/webhooks, Graph Data Connect where appropriate).
• Implement Azure AD app registrations, OAuth 2.0 flows, and least-privilege permissions (delegated vs. application) aligned with Conditional Access and tenant policies.
• Data Extraction and Integration
• Build robust pipelines to extract content and metadata (e.g., SharePoint lists/libraries, sites/drives/items, OneDrive, Teams channels/files, mailbox metadata, directory objects, audit/usage reports).
• Handle throttling, pagination, retries, delta sync, change tracking, and idempotent upserts.
• Transform and map data to target schemas; stage data (e.g., files/JSON/CSV/Parquet) and load into the proprietary data warehouse via APIs, connectors, or batch loads.
• Compliance and Governance
• Respect data residency, retention, MIP sensitivity labels, DLP, eDiscovery, and auditing requirements.
• Navigate protected endpoints (e.g., Teams messages export) and approval processes; propose compliant alternatives when needed.
Skills
• 5+ years building integrations with Microsoft 365, including advanced use of Microsoft Graph API.
• Proven delivery of data pipelines/ETL from M365 workloads:
• SharePoint Online and OneDrive (sites, lists, libraries, drives/files, permissions).
• Teams (channels, files; familiarity with protected chat/meeting export APIs and compliance boundaries).
• Exchange Online (mailbox and message metadata, calendars) and directory objects in Entra ID (Azure AD). Strong expertise in:
• OAuth 2.0, Azure AD app registrations, permissions consent, service principals, Conditional Access impacts.
• Graph SDKs and REST (C#/.NET or Python preferred); PowerShell for automation; Graph Explorer/Postman.
• Handling Graph constraints: throttling, batching, pagination, delta queries, webhooks/subscriptions.
• Data modeling and transformation; SQL; schema evolution; metadata and lineage.
• Experience integrating with custom/proprietary data warehouses (API-based or batch ingestion), including building connectors or staging layers.
• Solid understanding of M365 security, compliance, and governance (retention, labels, DLP, eDiscovery/audit).
• Self-starter who can operate independently in a part-time capacity; excellent communication and documentation.
• Experience with Azure services (Functions, Logic Apps, Data Factory, Storage) for orchestration and staging.
• Familiarity with Graph Data Connect, SharePoint REST/CSOM, Exchange Web Services deprecation nuances.
• CI/CD (GitHub Actions/Azure DevOps), containerization, and IaC (Bicep/Terraform).
• Background in performance tuning for large tenants (rate-limit strategy, parallelization, backoff).
}
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

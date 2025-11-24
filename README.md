# Resume Editor Tool

An AI-assisted resume tailoring tool that accepts a job description and LaTeX resume, calls Google's Gemini model for targeted improvements, and returns an updated resume with live PDF preview and ATS scoring insights.

## Features

- ✏️ Dual-pane editors for JD and LaTeX with Monaco Editor-powered UX.
- 🤖 Backend Gemini integration (Gemini 1.5 Flash 8B by default) with structured prompting.
- 📄 Real-time LaTeX → PDF compilation powered entirely by the local `tectonic` engine for Overleaf-quality output.
- 📥 One-click PDF download of the optimized resume.
- 📊 Heuristic ATS score for quick alignment feedback with JD keywords.

## Project layout

```
.
├── client   # React + Vite + Tailwind frontend
├── server   # Express + TypeScript backend (Gemini + Tectonic compiler)
├── package.json (npm workspaces)
└── README.md
```

## Quick start

1. **Install dependencies** (root workspace):

```bash
npm install
```

2. **Install Tectonic (LaTeX engine)**

Install [Tectonic](https://tectonic-typesetting.github.io/) and make sure the `tectonic` binary is on your PATH. (On Windows you can use the official MSI installer or Scoop; on macOS/Linux use Homebrew, Cargo, or the prebuilt binaries.)

3. **Environment variables**

Copy `server/.env.example` to `server/.env` and fill in your Gemini API key:

```
GEMINI_API_KEY=your_api_key_here
PORT=4000
CLIENT_ORIGIN=http://localhost:5173
GEMINI_MODEL=gemini-1.5-flash-8b-latest
TECTONIC_PATH=tectonic
REQUEST_TIMEOUT_MS=180000
```

4. **Run dev servers (concurrently)**

```bash
npm run dev
```

- Frontend: http://localhost:5173
- Backend: http://localhost:4000

## Production build

```bash
npm run build
npm run start   # serves API (deploy frontend separately, e.g., static hosting)
```

## Tests

Currently, unit tests cover the ATS scoring helper. Run them with:

```bash
npm test
```

## Enhancements backlog

- Persistent history with database (e.g., SQLite/Prisma).
- Authenticated multi-user workspaces.
- More robust ATS analysis (per-section grading, readability hints).
- Offline LaTeX compilation via WASM (tectonic) for air-gapped deployments.

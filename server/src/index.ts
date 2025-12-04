import cors, { type CorsOptions } from "cors";
import express, { Request, Response } from "express";
import { config } from "./config.js";
import { scoreResume } from "./lib/atsScore.js";
import { compileLatexToPdf } from "./services/latexProxy.js";
import { GeminiApiError, GeminiMissingKeyError, optimizeEmail, optimizeResume } from "./services/gemini.js";
import type {
  AtsScoreResponse,
  CompileResponse,
  EmailOptimizeRequestPayload,
  EmailOptimizeResponse,
  OptimizeRequestPayload,
  OptimizeResponse
} from "./types.js";

const app = express();

const corsOptions: CorsOptions = {
  origin(origin, callback) {
    if (!origin) {
      return callback(null, true);
    }

    if (config.clientOrigins.includes("*") || config.clientOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error(`Origin ${origin} is not allowed by CORS`));
  },
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json({ limit: "1mb" }));

if (config.requestTimeoutMs > 0) {
  app.use((req, res, next) => {
    req.setTimeout(config.requestTimeoutMs);
    res.setTimeout(config.requestTimeoutMs, () => {
      if (!res.headersSent) {
        res.status(504).json({ message: `Request timed out after ${config.requestTimeoutMs}ms` });
      }
    });
    next();
  });
}

const validatePayload = (payload: OptimizeRequestPayload) => {
  if (!payload.jd?.trim()) {
    throw new Error("Job description is required");
  }
  if (!payload.resume?.trim()) {
    throw new Error("Resume LaTeX is required");
  }
};

const validateEmailPayload = (payload: EmailOptimizeRequestPayload) => {
  if (!payload.description?.trim()) {
    throw new Error("Email context is required");
  }

  if (!payload.template?.trim()) {
    throw new Error("Email template is required");
  }
};

app.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok" });
});

app.post("/api/optimize", async (req: Request, res: Response) => {
  try {
    const payload = req.body as OptimizeRequestPayload;
    validatePayload(payload);

    const optimizedLatex = await optimizeResume(payload);
    const response: OptimizeResponse = { optimizedLatex };
    res.json(response);
  } catch (error) {
    console.error("/api/optimize error", error);
    const message = (error as Error).message || "Failed to optimize resume";
    const status = error instanceof GeminiMissingKeyError ? 503 : error instanceof GeminiApiError ? 502 : 500;
    res.status(status).json({ message });
  }
});

app.post("/api/email-optimize", async (req: Request, res: Response) => {
  try {
    const payload = req.body as EmailOptimizeRequestPayload;
    validateEmailPayload(payload);

    const optimized = await optimizeEmail(payload);
    const response: EmailOptimizeResponse = optimized;
    res.json(response);
  } catch (error) {
    console.error("/api/email-optimize error", error);
    const message = (error as Error).message || "Failed to optimize email";
    const status = error instanceof GeminiMissingKeyError ? 503 : error instanceof GeminiApiError ? 502 : 500;
    res.status(status).json({ message });
  }
});

app.post("/api/compile", async (req: Request, res: Response) => {
  try {
    const { latex } = req.body as { latex: string };
    if (!latex?.trim()) {
      return res.status(400).json({ message: "LaTeX content is required" });
    }

    const pdfBase64 = await compileLatexToPdf(latex);
    const response: CompileResponse = { pdfBase64 };
    res.json(response);
  } catch (error) {
    console.error("/api/compile error", error);
    res.status(500).json({ message: (error as Error).message || "Failed to compile LaTeX" });
  }
});

app.post("/api/ats-score", (req: Request, res: Response) => {
  try {
    const { jd, resume } = req.body as OptimizeRequestPayload;
    const result = scoreResume(jd || "", resume || "");
    const response: AtsScoreResponse = result;
    res.json(response);
  } catch (error) {
    console.error("/api/ats-score error", error);
    res.status(500).json({ message: (error as Error).message || "Failed to compute ATS score" });
  }
});

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("Unhandled error", err);
  res.status(500).json({ message: err.message || "Unexpected server error" });
});

const PORT = process.env.PORT || config.port;

app.listen(PORT, () => {
  console.log(`Resume Editor API running on port ${PORT}`);
});
;

import axios from "axios";
import type { EmailOptimization } from "../types.ts";

const FALLBACK_API_BASE_URL = "https://rizzum.onrender.com";
const isBrowser = typeof window !== "undefined";
const isLocalHost = () =>
  !isBrowser
    ? false
    : ["localhost", "127.0.0.1"].some((host) => window.location.hostname === host);

const resolvedBaseURL = import.meta.env.VITE_API_BASE_URL || (isBrowser && !isLocalHost() ? FALLBACK_API_BASE_URL : "");

const api = axios.create({
  baseURL: resolvedBaseURL || undefined,
  timeout: 180_000
});

export type OptimizePayload = {
  jd: string;
  resume: string;
};

export type EmailOptimizePayload = {
  description: string;
  template: string;
  subject?: string;
};

export const optimizeResume = (payload: OptimizePayload) => api.post("/api/optimize", payload);
export const compileLatex = (latex: string) => api.post("/api/compile", { latex });
export const fetchAtsScore = (payload: OptimizePayload) => api.post("/api/ats-score", payload);
export const optimizeEmail = (payload: EmailOptimizePayload) =>
  api.post<EmailOptimization>("/api/email-optimize", payload);

import axios from "axios";

const baseURL = import.meta.env.VITE_API_BASE_URL || "";

const api = axios.create({
  baseURL: baseURL || undefined,
  timeout: 180_000
});

export type OptimizePayload = {
  jd: string;
  resume: string;
};

export const optimizeResume = (payload: OptimizePayload) => api.post("/api/optimize", payload);
export const compileLatex = (latex: string) => api.post("/api/compile", { latex });
export const fetchAtsScore = (payload: OptimizePayload) => api.post("/api/ats-score", payload);

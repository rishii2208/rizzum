import axios from "axios";
const baseURL = import.meta.env.VITE_API_BASE_URL || "";
const api = axios.create({
    baseURL: baseURL || undefined,
    timeout: 20_000
});
export const optimizeResume = (payload) => api.post("/api/optimize", payload);
export const compileLatex = (latex) => api.post("/api/compile", { latex });
export const fetchAtsScore = (payload) => api.post("/api/ats-score", payload);

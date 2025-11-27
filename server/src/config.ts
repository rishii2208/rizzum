import dotenv from "dotenv";

dotenv.config();

const requiredEnv = ["GEMINI_API_KEY"] as const;

requiredEnv.forEach((key) => {
  if (!process.env[key]) {
    console.warn(`[config] Missing ${key} in environment. Some features may fail until it's set.`);
  }
});

const parseOrigins = (value?: string) =>
  value
    ?.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

const fallbackOrigins = ["http://localhost:5173", "http://127.0.0.1:5173"];
const configuredOrigins =
  parseOrigins(process.env.CLIENT_ORIGINS) || parseOrigins(process.env.CLIENT_ORIGIN) || undefined;

export const config = {
  port: Number(process.env.PORT) || 4000,
  clientOrigins: configuredOrigins?.length ? configuredOrigins : fallbackOrigins,
  geminiKey: process.env.GEMINI_API_KEY || "",
  geminiModel: process.env.GEMINI_MODEL || "models/gemini-2.5-flash",
  tectonicPath: process.env.TECTONIC_PATH || "tectonic",
  requestTimeoutMs: Number(process.env.REQUEST_TIMEOUT_MS) || 180_000
};

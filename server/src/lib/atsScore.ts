const STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "for",
  "in",
  "of",
  "on",
  "the",
  "to",
  "with",
  "is",
  "are",
  "be",
  "by",
  "or",
  "as",
  "at"
]);

const tokenize = (input: string): string[] => {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9+\s]/g, " ")
    .split(/\s+/)
    .filter((token) => token && !STOP_WORDS.has(token));
};

export type AtsScore = {
  coverage: number;
  matchedKeywords: string[];
  missingKeywords: string[];
};

export const scoreResume = (jd: string, resume: string): AtsScore => {
  if (!jd.trim()) {
    return { coverage: 0, matchedKeywords: [], missingKeywords: [] };
  }

  const jdTokens = tokenize(jd);
  const resumeTokens = new Set(tokenize(resume));

  const jdFrequency = jdTokens.reduce<Record<string, number>>((acc, token) => {
    acc[token] = (acc[token] || 0) + 1;
    return acc;
  }, {});

  const uniqueKeywords = Object.keys(jdFrequency);
  const matched: string[] = [];
  const missing: string[] = [];

  uniqueKeywords.forEach((keyword) => {
    if (resumeTokens.has(keyword)) {
      matched.push(keyword);
    } else {
      missing.push(keyword);
    }
  });

  const coverage = uniqueKeywords.length
    ? Math.round((matched.length / uniqueKeywords.length) * 100)
    : 0;

  return {
    coverage,
    matchedKeywords: matched.sort((a, b) => jdFrequency[b] - jdFrequency[a]).slice(0, 10),
    missingKeywords: missing.sort((a, b) => jdFrequency[b] - jdFrequency[a]).slice(0, 10)
  };
};

export type OptimizeRequestPayload = {
  jd: string;
  resume: string;
};

export type OptimizeResponse = {
  optimizedLatex: string;
};

export type CompileResponse = {
  pdfBase64: string;
};

export type AtsScoreResponse = {
  coverage: number;
  matchedKeywords: string[];
  missingKeywords: string[];
};

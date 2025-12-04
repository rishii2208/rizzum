export type OptimizeRequestPayload = {
  jd: string;
  resume: string;
};

export type OptimizeResponse = {
  optimizedLatex: string;
};

export type EmailOptimizeRequestPayload = {
  description: string;
  template: string;
  subject?: string;
};

export type EmailOptimizeResponse = {
  optimizedSubject: string;
  optimizedBody: string;
};

export type CompileResponse = {
  pdfBase64: string;
};

export type AtsScoreResponse = {
  coverage: number;
  matchedKeywords: string[];
  missingKeywords: string[];
};

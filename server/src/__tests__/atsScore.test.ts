import { describe, expect, it } from "vitest";
import { scoreResume } from "../lib/atsScore.js";

describe("scoreResume", () => {
  it("returns zero coverage when JD is empty", () => {
    const result = scoreResume("", "whatever");
    expect(result.coverage).toBe(0);
    expect(result.matchedKeywords).toEqual([]);
  });

  it("identifies overlap between JD and resume", () => {
    const jd = "Looking for a React engineer with TypeScript and GraphQL";
    const resume = "Experienced React and TypeScript developer";
    const result = scoreResume(jd, resume);

    expect(result.coverage).toBeGreaterThan(0);
    expect(result.matchedKeywords).toContain("react");
    expect(result.missingKeywords).toContain("graphql");
  });
});

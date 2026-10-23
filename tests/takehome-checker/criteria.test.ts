import { describe, expect, it } from "vitest";
import { criteria } from "@/takehome-checker/constants";

const rubrics = ["*", "frontend", "backend", "cli", "fullstack", "ml", "written"];
const colors = ["red", "yellow", "info", "off"];

describe("criteria", () => {
  it.each(Object.entries(criteria))("%s is complete", (_, criterion) => {
    expect(["code", "ai"]).toContain(criterion.check);
    expect(criterion.title).not.toBe("");
    if (criterion.check === "ai") expect(["docs", "code", "assignment"]).toContain(criterion.reads);
    expect(criterion.detects).not.toBe("");
    expect(criterion.feedback).not.toBe("");
    expect(Object.keys(criterion.severity).length).toBeGreaterThan(0);
    for (const [rubric, color] of Object.entries(criterion.severity)) {
      expect(rubrics).toContain(rubric);
      expect(colors).toContain(color);
    }
  });
});

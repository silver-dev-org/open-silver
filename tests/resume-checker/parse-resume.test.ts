import { parseResume } from "@/resume-checker/parse-resume";
import pdf from "pdf-parse";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("pdf-parse", () => ({ default: vi.fn() }));

describe("parseResume", () => {
  const log = vi.fn();
  const warn = vi.fn();
  let originalLog: typeof console.log;

  beforeEach(() => {
    originalLog = console.log;
    console.log = log;
    vi.spyOn(console, "warn").mockImplementation(warn);
  });

  afterEach(() => {
    console.log = originalLog;
    vi.restoreAllMocks();
    vi.resetAllMocks();
  });

  /* pdf.js reports these through console.log, so they would land as INFO. */
  it("raises pdf.js warnings to console.warn", async () => {
    vi.mocked(pdf).mockImplementationOnce(async () => {
      console.log("Warning: TT: undefined function: 21");
      console.log("unrelated output");
      return { text: "cv" } as never;
    });

    await parseResume(Buffer.from("pdf"));

    expect(warn).toHaveBeenCalledWith("Warning: TT: undefined function: 21");
    expect(log).toHaveBeenCalledWith("unrelated output");
    expect(log).not.toHaveBeenCalledWith("Warning: TT: undefined function: 21");
  });

  it("restores console.log once the last concurrent parse settles", async () => {
    let finishFirst = () => {};
    vi.mocked(pdf)
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            finishFirst = () => resolve({ text: "a" } as never);
          }),
      )
      .mockRejectedValueOnce(new Error("Invalid PDF structure"));

    const first = parseResume(Buffer.from("a"));
    await expect(parseResume(Buffer.from("b"))).rejects.toThrow();
    expect(console.log).not.toBe(log);

    finishFirst();
    await first;
    expect(console.log).toBe(log);
  });
});

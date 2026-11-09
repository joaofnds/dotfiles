import { describe, expect, test } from "bun:test";
import { cancelOutputs } from "./output-cleanup.ts";

describe("output cleanup", () => {
  test("retains a native reader cancellation failure", async () => {
    const stdout = new ReadableStream({
      cancel: () => Promise.reject(new Error("native stdout cancellation failed")),
    }).getReader();
    const stderr = new ReadableStream().getReader();

    const cleanup = await cancelOutputs({ stdout, stderr });

    expect(cleanup).toEqual({
      state: "uncertain",
      errors: ["stdout cleanup failed: native stdout cancellation failed"],
    });
  });

  test("retains uncertainty when a reader never completes cancellation", async () => {
    const stdout = new ReadableStream({ cancel: () => new Promise<void>(() => {}) }).getReader();
    const stderr = new ReadableStream().getReader();
    const started = performance.now();

    const cleanup = await cancelOutputs({ stdout, stderr });

    expect(cleanup).toEqual({
      state: "uncertain",
      errors: ["stdout cleanup did not complete within 200ms"],
    });
    expect(performance.now() - started).toBeLessThan(1500);
  });
});

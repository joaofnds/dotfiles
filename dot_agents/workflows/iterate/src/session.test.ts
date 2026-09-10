import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { SessionHarness } from "./testing/session-harness.ts";

describe("session", () => {
  let harness: SessionHarness;
  beforeAll(() => {
    harness = SessionHarness.setup();
  });
  afterAll(async () => {
    await harness.teardown();
  });

  test.each(["claude", "codex"] as const)(
    "streams %s progress before the final reply",
    async (provider) => {
      const driver = await harness.start(provider);

      const progress = await driver.progress();
      expect(progress.stdout).toBe("");
      expect(progress.stderr).toContain("progress before final");
      const result = await driver.finish();

      expect(result).toEqual({ code: 0, stdout: "final reply\n" });
    },
    6000,
  );

  describe("when codex does not successfully complete", () => {
    test.each(["malformed", "error", "truncated"] as const)(
      "rejects %s output after a candidate reply",
      async (scenario) => {
        const driver = await harness.start("codex", scenario);

        const result = await driver.finish();

        expect(result.code).toBe(1);
      },
      6000,
    );
  });

  test("stops the agent and its signal-resistant descendant on SIGINT", async () => {
    const driver = await harness.start("codex", "interrupt");

    const result = await driver.interrupt();

    expect(result).toEqual({ code: 1, stopped: ["agent", "descendant"] });
  }, 6000);
});

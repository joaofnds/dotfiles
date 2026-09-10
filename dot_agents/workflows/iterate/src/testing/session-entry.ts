import process from "node:process";
import { Exit } from "../exit.ts";
import { session } from "../session.ts";

try {
  await session({
    agent: {
      provider: process.env.SESSION_PROVIDER === "claude" ? "claude" : "codex",
      model: "fake",
    },
    stage: "build",
    card: "test-card",
    systemPrompt: "test session",
    budget: "1",
  });
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = error instanceof Exit ? error.code : 1;
}

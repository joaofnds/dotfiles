import process from "node:process";
import { defaultAgent } from "../agents.ts";
import { Exit } from "../exit.ts";
import { SessionFailure, session } from "../session.ts";

try {
  const logDirectory = process.env.SESSION_LOG_DIRECTORY;
  const result = await session({
    agent: defaultAgent,
    stage: "build",
    card: "test-card",
    systemPrompt: "test session",
    budget: "1",
    ...(logDirectory === undefined ? {} : { logDirectory }),
    ...(process.env.SESSION_TIMEOUT_MS === undefined
      ? {}
      : { timeoutMs: Number(process.env.SESSION_TIMEOUT_MS) }),
  });
  console.error(`SESSION_RESULT ${JSON.stringify(result)}`);
} catch (error) {
  if (error instanceof SessionFailure) {
    console.error(`SESSION_RESULT ${JSON.stringify(error.result)}`);
  }
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = error instanceof Exit ? error.code : 1;
}

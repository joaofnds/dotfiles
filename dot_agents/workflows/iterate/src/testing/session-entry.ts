import process from "node:process";
import { defaultAgent } from "../agents.ts";
import { definedFields, nonEmpty } from "../defined-fields.ts";
import { Exit } from "../exit.ts";
import { Journal } from "../journal.ts";
import { SessionFailure, session } from "../session.ts";
import { fixtureAdapter, startupInterruptionAdapter } from "./session-protocol.ts";

const journal = await Journal.open("test-card");
const attempt = await journal.begin("build", "test-card", defaultAgent);
const wallNow = Date.now;

try {
  const logDirectory = process.env.SESSION_LOG_DIRECTORY;
  const scenario = process.env.SESSION_SCENARIO;
  let adapter: ReturnType<typeof fixtureAdapter> | undefined;
  if (scenario === "interrupt-on-spawn" || scenario === "terminate-on-spawn") {
    adapter = startupInterruptionAdapter(
      scenario === "interrupt-on-spawn" ? "INT" : "TERM",
      logDirectory ?? process.cwd(),
    );
  } else if (scenario?.startsWith("fixture-")) {
    adapter = fixtureAdapter(scenario === "fixture-stdin" ? "stdin" : "argv");
  }

  const idleTimeout = process.env.SESSION_IDLE_TIMEOUT_MS;
  const timeout = process.env.SESSION_TIMEOUT_MS;
  const pending = session(
    Object.assign(
      {
        agent: defaultAgent,
        stage: "build" as const,
        card: "test-card",
        systemPrompt: process.env.SESSION_PROMPT ?? "test session",
        budget: "1",
      },
      definedFields({
        resumeSessionId: nonEmpty(process.env.SESSION_RESUME_ID),
        logDirectory,
        idleTimeoutMs: idleTimeout === undefined ? undefined : Number(idleTimeout),
        timeoutMs: timeout === undefined ? undefined : Number(timeout),
      }),
    ),
    adapter,
  );

  if (process.env.SESSION_SCENARIO === "clock-backward") Date.now = () => wallNow() - 60_000;
  else if (process.env.SESSION_SCENARIO === "clock-forward") Date.now = () => wallNow() + 60_000;

  const result = await pending;
  await journal.finish(attempt, result);
  console.error(`SESSION_RESULT ${JSON.stringify(result)}`);
} catch (error) {
  if (error instanceof SessionFailure) {
    await journal.finish(attempt, error.result);
    console.error(`SESSION_RESULT ${JSON.stringify(error.result)}`);
  }
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = error instanceof Exit ? error.code : 1;
} finally {
  Date.now = wallNow;
}

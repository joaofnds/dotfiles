import { z } from "zod";
import type { StageAgent } from "./agents.ts";
import type { SessionInput } from "./session-input.ts";
import { costSchema, usageSchema } from "./usage.ts";

export type RuntimeContract = {
  readonly cliVersion: string;
  readonly fingerprint: string;
  readonly rolePolicy: string;
  readonly localInputs?: { readonly established: boolean; readonly reasons: readonly string[] };
  readonly coverage?: readonly string[];
  readonly unknowns?: readonly string[];
};

export type { SessionInput } from "./session-input.ts";

/** Settings a harness reports for its session. Each adapter owns and checks its own shape. */
export const configuredSessionSchema = z.looseObject({
  provenance: z.string(),
  model: z.string().nullable().optional(),
  effort: z.string().nullable().optional(),
});
export type ConfiguredSession = Readonly<z.infer<typeof configuredSessionSchema>>;

/** A provider message the harness could not read, which leaves the session unobserved. */
export class InvalidProviderMessage extends Error {}

const text = z.string();
const count = z.number().int().nonnegative();
export const toolOutcomeSchema = z.object({
  itemId: text,
  kind: text,
  status: text,
  raw: z.unknown(),
});
export type ToolOutcome = Readonly<z.infer<typeof toolOutcomeSchema>>;

/** What a harness reports to the session, one event at a time. */
export const providerEventSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("configured_session"), configuration: configuredSessionSchema }),
  z.object({ type: z.literal("tool_outcome"), outcome: toolOutcomeSchema }),
  z.object({ type: z.literal("required_tool_coverage"), coverage: z.literal("unknown") }),
  z.object({ type: z.literal("text"), text }),
  z.object({ type: z.literal("tool_call"), name: text, args: text }),
  z.object({ type: z.literal("result"), result: text }),
  z.object({ type: z.literal("session_id"), sessionId: text }),
  z.object({ type: z.literal("resolved_model"), model: text }),
  z.object({ type: z.literal("permission_mode"), mode: text }),
  z.object({ type: z.literal("permission_denials"), count }),
  z.object({ type: z.literal("task_started"), taskId: text, description: text }),
  z.object({ type: z.literal("task_killed"), taskId: text }),
  z.object({ type: z.literal("error"), message: text }),
  z.object({
    type: z.literal("usage"),
    receiptId: text.exactOptional(),
    turns: count.exactOptional(),
    cost: costSchema.exactOptional(),
    usage: usageSchema,
  }),
  z.object({ type: z.literal("complete") }),
]);
export type ProviderEvent = Readonly<z.infer<typeof providerEventSchema>>;

export type ProviderCommand = {
  readonly argv: readonly string[];
  readonly stdin?: string;
  readonly permissionMode?: string;
  /** Why the command cannot start, so the session records a failure with no child. */
  readonly unavailable?: string;
};

export type Capabilities = {
  readonly resume: boolean;
  readonly model: boolean;
  readonly efforts: readonly string[];
  readonly modelEfforts?: Readonly<Record<string, readonly string[]>>;
  readonly dollarCap: boolean;
  readonly dollarCapBasis?: "invocation" | "sessionCumulative";
  readonly defaultDollarCap?: number;
};

export type ProviderAdapter = {
  readonly provider: string;
  readonly capabilities: Capabilities;
  readonly command: (input: SessionInput) => ProviderCommand;
  readonly decode: (line: string) => readonly ProviderEvent[];
};

/** What a session needs from its harness: the protocol plus the rules that judge its result. */
export type SessionAdapter = ProviderAdapter & {
  readonly providerCompletion: boolean;
  readonly resume: Pick<ResumePolicy, "resolvedModelMustMatchPin">;
};

/** What the runner knows of a harness before it runs, on both sides of the session host. */
export type HarnessProfile = {
  readonly provider: string;
  readonly displayName: string;
  /** The CLI the harness's SDK ships with, or undefined where it ships none for this platform. */
  readonly bundledExecutable: () => string | undefined;
  readonly summary: string;
  readonly capabilities: Capabilities;
  readonly providerCompletion: boolean;
  readonly resume: ResumePolicy;
  readonly runtimeContract: (input: RuntimeContractInput) => Promise<RuntimeContract>;
};

export type HarnessAdapter = SessionAdapter & HarnessProfile;

/** One vendor SDK behind the runner. Its session runs inside the runner's owned process group. */
export type Harness = HarnessProfile & {
  readonly permissionMode?: string;
  /** Refuses a session the harness cannot run as asked, before anything launches. */
  readonly admit?: (input: SessionInput) => void;
  readonly run: (input: SessionInput, context: HarnessRun) => AsyncIterable<HarnessMessage>;
};

/**
 * One provider message as the SDK delivered it, with its events as one batch so a
 * replayed message is recognized whole. The raw message keeps the session log faithful.
 */
export type HarnessMessage = {
  readonly message?: unknown;
  readonly events: readonly ProviderEvent[];
};

export type HarnessRun = {
  readonly executable: string;
};

export type RuntimeContractInput = {
  readonly executable: string;
  readonly cliVersion: string;
  readonly rolePolicy: string;
};

export type PriorSession = {
  readonly resolvedModel?: string | undefined;
  readonly configuredSession?: ConfiguredSession | undefined;
};

export type ResumePolicy = {
  readonly requiresEstablishedLocalInputs: boolean;
  readonly resolvedModelMustMatchPin: boolean;
  readonly configurationMatches: (input: {
    readonly previous: PriorSession;
    readonly agent: StageAgent;
  }) => boolean;
};

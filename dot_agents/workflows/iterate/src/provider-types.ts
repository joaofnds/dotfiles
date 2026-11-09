import { z } from "zod";
import type { Stage, StageAgent } from "./agents.ts";
import type { SessionCost, UsageReport } from "./usage.ts";

export type RuntimeContract = {
  readonly cliVersion: string;
  readonly fingerprint: string;
  readonly rolePolicy: string;
  readonly localInputs?: { readonly established: boolean; readonly reasons: readonly string[] };
  readonly coverage?: readonly string[];
  readonly unknowns?: readonly string[];
};

export type SessionInput = {
  readonly agent: StageAgent;
  readonly stage: Stage;
  readonly card: string;
  readonly systemPrompt: string;
  readonly budget?: string;
  readonly logDirectory?: string;
  readonly resumeSessionId?: string;
  readonly resumeConfiguration?: ConfiguredSession;
  readonly timeoutMs?: number;
  readonly idleTimeoutMs?: number;
};

/** Settings a harness reports for its session. Each adapter owns and checks its own shape. */
export const configuredSessionSchema = z.looseObject({
  provenance: z.string(),
  model: z.string().nullable().optional(),
  effort: z.string().nullable().optional(),
});
export type ConfiguredSession = Readonly<z.infer<typeof configuredSessionSchema>>;

/** A provider message the harness could not read, which leaves the session unobserved. */
export class InvalidProviderMessage extends Error {}

export type ModelReroute = {
  readonly fromModel: string;
  readonly toModel: string;
  readonly reason: string;
};

export type ToolOutcome = {
  readonly itemId: string;
  readonly kind: string;
  readonly status: string;
  readonly raw: unknown;
};

export type ProviderEvent =
  | { readonly type: "model_reroute"; readonly receipt: ModelReroute }
  | { readonly type: "configured_session"; readonly configuration: ConfiguredSession }
  | { readonly type: "tool_outcome"; readonly outcome: ToolOutcome }
  | { readonly type: "required_tool_coverage"; readonly coverage: "unknown" }
  | { readonly type: "text"; readonly text: string }
  | { readonly type: "tool_call"; readonly name: string; readonly args: string }
  | { readonly type: "result"; readonly result: string }
  | { readonly type: "session_id"; readonly sessionId: string }
  | { readonly type: "resolved_model"; readonly model: string }
  | { readonly type: "effective_effort"; readonly effort: string }
  | { readonly type: "permission_mode"; readonly mode: string }
  | { readonly type: "permission_denials"; readonly count: number }
  | { readonly type: "task_started"; readonly taskId: string; readonly description: string }
  | { readonly type: "task_killed"; readonly taskId: string }
  | { readonly type: "error"; readonly message: string }
  | {
      readonly type: "usage";
      readonly receiptId?: string;
      readonly turns?: number;
      readonly cost?: SessionCost;
      readonly usage: UsageReport;
    }
  | { readonly type: "complete" };

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

export type HarnessAdapter = SessionAdapter & {
  readonly displayName: string;
  readonly executableName: string;
  readonly summary: string;
  readonly runtimeContract: (input: RuntimeContractInput) => Promise<RuntimeContract>;
  readonly resume: ResumePolicy;
};

/** One vendor SDK behind the runner. Its session runs inside the runner's owned process group. */
export type Harness = {
  readonly provider: string;
  readonly displayName: string;
  readonly executableName: string;
  readonly summary: string;
  readonly capabilities: Capabilities;
  readonly providerCompletion: boolean;
  readonly permissionMode?: string;
  readonly resume: ResumePolicy;
  readonly runtimeContract: (input: RuntimeContractInput) => Promise<RuntimeContract>;
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
  readonly modelReroutes?: readonly ModelReroute[] | undefined;
};

export type ResumePolicy = {
  readonly requiresEstablishedLocalInputs: boolean;
  readonly resolvedModelMustMatchPin: boolean;
  readonly configurationMatches: (input: {
    readonly previous: PriorSession;
    readonly agent: StageAgent;
  }) => boolean;
};

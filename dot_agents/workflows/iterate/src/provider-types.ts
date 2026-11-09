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
export type ConfiguredSession = {
  readonly provenance: string;
  readonly model?: string | null | undefined;
  readonly effort?: string | null | undefined;
  readonly [field: string]: unknown;
};

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

export type ProtocolUpdate = {
  readonly events: readonly ProviderEvent[];
  readonly input?: string;
  readonly close?: boolean;
};

// Constructed once per prepared attempt. No transport or process ownership here.
export type ProviderProtocol = {
  readonly initialInput: string;
  readonly receive: (line: string) => ProtocolUpdate;
  readonly end: () => void;
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
  readonly protocol?: ProviderProtocol;
  readonly decoder?: {
    readonly receive: (line: string) => readonly ProviderEvent[];
    readonly end: () => readonly ProviderEvent[];
  };
  readonly permissionMode?: string;
};

export type ProviderAdapter = {
  readonly provider: string;
  readonly capabilities: {
    readonly resume: boolean;
    readonly model: boolean;
    readonly efforts: readonly string[];
    readonly modelEfforts?: Readonly<Record<string, readonly string[]>>;
    readonly promptTransport: "argv" | "stdin";
    readonly dollarCap: boolean;
    readonly dollarCapBasis?: "invocation" | "sessionCumulative";
    readonly defaultDollarCap?: number;
  };
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

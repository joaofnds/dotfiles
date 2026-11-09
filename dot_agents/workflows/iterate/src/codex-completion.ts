import { z } from "zod";

const evidence = z.string().trim().min(1);
export const codexCompletionSchema = z.strictObject({
  schemaVersion: z.literal(1),
  outcome: z
    .enum(["completed", "blocked", "failed"])
    .describe(
      "Operational work outcome. A completed investigation may have a negative or inconclusive scientific answer. Use blocked or failed when required work could not be performed.",
    ),
  requiredToolBlockers: z
    .array(z.strictObject({ tool: evidence, reason: evidence, evidencePath: evidence }))
    .describe(
      "Agent-reported blockers preventing required tool work, excluding expected nonzero exploratory probes.",
    ),
  cardState: evidence,
  claims: z.array(z.strictObject({ claim: evidence, evidencePath: evidence })),
  errors: z.array(z.string()),
  scopeChanges: z.array(z.string()),
  unresolvedDecisions: z.array(z.string()),
  recordPath: evidence,
});

export const codexCompletionOutputSchema = z.toJSONSchema(codexCompletionSchema);

export function codexCompletionError(reply: string): string | undefined {
  let raw: unknown;
  try {
    raw = JSON.parse(reply);
  } catch {
    return "Codex completion protocol: final reply is not valid JSON";
  }

  const parsed = codexCompletionSchema.safeParse(raw);
  if (!parsed.success) return "Codex completion protocol: invalid completion record";

  const completion = parsed.data;
  if (completion.outcome !== "completed" || completion.requiredToolBlockers.length > 0)
    return `Codex agent-reported completion: ${completion.outcome}; required tool blockers: ${completion.requiredToolBlockers.length}`;

  return undefined;
}

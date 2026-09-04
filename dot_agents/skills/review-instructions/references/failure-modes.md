# Instruction Failure Modes

- **Context rot**: recall degrades as prompt size grows.
- **Lost-in-the-middle**: rules buried mid-prompt receive less attention.
- **Instruction-saturation**: too many simultaneous rules reduce compliance.
- **Instruction-hierarchy collision**: lower-priority text conflicts with higher-priority instructions.
- **Conflict-silent compliance**: conflicting rules are resolved without surfacing the conflict.
- **Dispatch ambiguity**: invocation and skip conditions do not identify one clear route.
- **Over-triggering**: aggressive trigger language invokes a skill outside its scope.
- **Judgment displacement**: a rule pins a context-dependent judgment call to a constant
  ("always 3 retries", "cap files at 200 lines") and current models comply faithfully even
  where context makes the constant wrong (evidence: `references/external-facts.md` §Cited sources).
- **Assumed shared context**: guidance vague enough to presume project knowledge the
  model lacks; the gap fills silently with plausible generic defaults, not with a
  question (evidence: `references/external-facts.md` §Cited sources).
- **Pink-elephant negation**: a negative names the prohibited behavior without a positive replacement.
- **Caller-context leakage**: a fresh sub-agent is assumed to know caller state.
- **Premature completion**: an agent lacks a checkable completion gate.
- **Borrowed authority**: another agent's assertion is consumed as verified evidence.
- **Linter laundering**: deterministic checks consume prompt budget instead of tooling.
- **No-op / self-reference**: a rule imposes no identifiable action, artifact, omission,
  evidence requirement, or boundary (the same five are mirrored in
  the review-instructions skill's rule that an instruction changes an action; edit
  both together).
- **Instruction laundering**: the same rule appears under several headings *that load
  together*. The corpus loads progressively, so restatement across paths the router never
  combines is not laundering: it is the only copy on that path, and cutting it deletes the
  rule from that phase. Establish which case it is before cutting.
- **Decay**: a path, version, tool, or mechanism has gone stale.

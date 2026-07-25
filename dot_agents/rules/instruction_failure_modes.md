# Instruction Failure Modes

- **Context rot** — recall degrades as prompt size grows.
- **Lost-in-the-middle** — rules buried mid-prompt receive less attention.
- **Instruction-saturation** — too many simultaneous rules reduce compliance.
- **Instruction-hierarchy collision** — lower-priority text conflicts with higher-priority instructions.
- **Conflict-silent compliance** — conflicting rules are resolved without surfacing the conflict.
- **Dispatch ambiguity** — invocation and skip conditions do not identify one clear route.
- **Over-triggering** — aggressive trigger language invokes a skill outside its scope.
- **Cache invalidation** — volatile prefix content defeats prompt caching.
- **Pink-elephant negation** — a negative names the prohibited behavior without a positive replacement.
- **Caller-context leakage** — a fresh sub-agent is assumed to know caller state.
- **Premature completion** — an agent lacks a checkable completion gate.
- **Linter laundering** — deterministic checks consume prompt budget instead of tooling.
- **No-op / self-reference** — a rule does not change behavior from model defaults.
- **Restatement-over-leading-word** — prose replaces a precise established term.
- **Instruction laundering** — the same rule appears under several headings.
- **Decay** — a path, version, tool, or mechanism has gone stale.

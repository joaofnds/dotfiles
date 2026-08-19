# Dispatch fields: tools, permissions, and fork semantics

Tier-3 reference for `agents/instructions-reviewer.md` §2. Load it before ranking any
finding on a tool field, a permission rule, or a fork, and skip it entirely on an
artifact with no such frontmatter: a rules file, a memory file, an output style, a
plain `AGENTS.md`.

Every mechanic here is release-coupled and mirrored from
`~/.agents/rules/instruction_external_facts.md` §Harness mechanics, which carries the
last-checked state: edit together, and never assert one from memory.

## Tool fields are not one mechanism: check which one you're reading

A sub-agent's `tools` restricts, with `disallowedTools` subtracting from it.

A skill's `allowed-tools` does **not** restrict: it pre-approves permission prompts for
the invoking turn while every tool stays callable. The restrictive field on a skill is
`disallowed-tools`. Both lapse on the next user message.

**Treating a skill's `allowed-tools` as a safety boundary is a Blocker.** It is a false
boundary, in the field an author is most likely to trust.

`user-invocable: false` is the same trap in a different field: it controls menu
visibility only, not `Skill` tool access, so it is never a boundary either.
`disable-model-invocation: true` is what blocks programmatic invocation.

## Sub-agent `tools` resolves differently by run mode

A background sub-agent keeps every MCP tool but only a fixed subset of the built-in
ones, and that narrowing subtracts from the field: the same definition can expose
different tools in the foreground and the background. A `tools` list where no entry
resolves usually fails the agent at launch.

Flag a definition that depends on a **built-in** tool outside the background set
without stating which mode it runs in. `instruction_external_facts.md` §Harness mechanics lists the
set; read it rather than guessing.

## Permission rules

Rules evaluate `deny` → `ask` → `allow`, first match wins, and specificity does not
reorder them. So a narrow `allow` cannot carve an exception out of a broad `deny`, and
a matching `ask` prompts even when a more specific `allow` also matches. Verify the
intersection matches intent, and flag an allowlist exception written under a broader
deny.

A workflow-spawned sub-agent runs in `acceptEdits` and inherits the session allowlist
regardless of the session's permission mode, so its `tools` list is not a boundary
there. Check `disableWorkflows` in the settings §Inputs had you read before ranking a
finding on this: a workflow cannot be spawned while it is on.

## Forks

A skill's `context: fork` inherits **no** caller context, so the body must be a
self-sufficient task spec. A **conversation** fork (`/subtask`) is the opposite: it
inherits the whole conversation. Settle which one an artifact means before requiring a
self-sufficient spec.

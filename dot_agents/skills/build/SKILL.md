---
name: build
description: >
  Pick up an implementation plan written by /plan (or any docs/plans/*.md plan)
  and execute it faithfully in a fresh session. Invoke when the user points at a
  plan file and wants it built — "build @docs/plans/...", "implement this plan",
  "resume", "pick up where we left off". Takes the plan path as an argument; if
  none is given, list docs/plans/ and ask which one.
metadata:
  trigger: A /plan implementation plan file exists and the user wants it executed in this session
---

# Build

Execute an implementation plan written by `/plan` in a previous session. The plan is the source of truth — you have no memory of the conversation that produced it, so trust the file, not assumptions.

## Steps

1. **Read the whole plan first.** Don't start on task 1 until you've read every section — Scope, Approach, Current state, Gotchas, and the task tracker all constrain how you implement.
2. **Reality-check before touching anything.** Confirm the files and `file:line` references in "Current state" still exist and match what the plan describes. If reality has drifted, STOP and surface it — don't silently adapt. (The plan's "For the executing session" section says the same; honor it.)
3. **Work the task tracker top to bottom, in order.** Each `- [ ]` item names what changes and how to confirm it works. Do one item, verify it the way the item specifies, then flip it to `- [x]` in the plan file before moving on — so progress survives if this session also dies.
4. **Run the testing strategy** as written (use the exact test command the plan names).
5. **Stay inside scope.** Don't implement anything outside the plan's Scope boundary. If you spot necessary follow-up work, add it as a new unchecked task or a note — don't expand silently.

## Rules

- Follow the project's normal coding and testing standards while implementing (the usual rule files still apply — this skill doesn't override them).
- If the plan is wrong, ambiguous, or contradicts the codebase, stop and ask rather than guessing.
- Keep the plan file updated as you go: checked boxes, plus a short note on any task you had to deviate on and why.
- When every task is checked and tests pass, summarize what was done and flag anything left deferred.

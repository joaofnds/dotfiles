---
name: build
description: >
  Pick up an implementation plan written by /plan (or any .boris/plans/*.md plan)
  and execute it faithfully in a fresh session. Invoke when the user points at a
  plan file and wants it built — "build @.boris/plans/...", "implement this plan",
  "resume", "pick up where we left off". Takes the plan path as an argument; if
  none is given, list .boris/plans/ and ask which one.
metadata:
  trigger: A /plan implementation plan file exists and the user wants it executed in this session
---

# Build

Execute an implementation plan written by `/plan` in a previous session. The plan is the source of truth — you have no memory of the conversation that produced it, so trust the file, not assumptions. Implementation is test-driven: each task runs as an outside-in red→green loop (step 4), never as code-first-tests-later.

## Steps

1. **Read the whole plan first.** Don't start on task 1 until you've read every section — Scope, Approach, Current state, Gotchas, and the task tracker all constrain how you implement.
2. **Reality-check before touching anything.** Confirm the files and `file:line` references in "Current state" still exist and match what the plan describes. If reality has drifted, STOP and surface it — don't silently adapt. (The plan's "For the executing session" section says the same; honor it.)
3. **Work the task tracker top to bottom, in order.** Do one item at a time, executing it via the loop in step 4, then flip it to `- [x]` in the plan file before moving on — so progress survives if this session also dies.
4. **Execute each task as an outside-in TDD loop.** The full discipline lives in `~/.agents/rules/testing/00-index.md`; read it before the first task. For the behavior this task adds:
   1. Write a failing test at the outermost seam available (driver-level when a harness exists) and run it. Show the failure — a test isn't red until you've seen it red.
   2. Make the smallest change that moves the failure deeper — e.g., for an HTTP task: the endpoint exists but returns 501 → returns 200 with a hard-coded body → returns real data from persistence. Run the test after each change and read where the error lives now; that movement is the proof the step landed. Scale the intermediate steps to your uncertainty — when the implementation is obvious, write it directly, still test-first (the three green-step tactics in `00-index.md` govern the choice).
   3. On green, refactor what this step touched, keeping the test green. Loop to the next failing expectation until the task's behavior is complete.

   Every iteration produces visible evidence: the red output before the change, the green (or deeper-red) output after. Writing the task's code first and backfilling tests is the exact failure this loop exists to prevent — if you catch yourself doing it, stop and restart the task from the failing test. A task with no runtime-observable behavior (config, docs, tooling) skips the loop; its own confirmation step is the verification.
5. **Run the testing strategy once every task is checked.** Use the exact test command the plan names. Steps 5–7 run once, at the end — not per task.
6. **Refactor pass on green.** With every task checked and the suite passing, reread the full diff and ask what would make the *next* feature cheaper to build: a concept that deserves a clearer name, a dependency to decouple, duplication to extract into shared functionality, an abstraction that isn't earning its keep. Apply the small, safe improvements now, rerunning the tests after each. List larger ones in the wrap-up as proposals. If nothing warrants changing, say "refactor pass: nothing to change" — a silent skip is indistinguishable from a forgotten step.
7. **Verify end-to-end before declaring done.** Once the refactor pass is done and the plan's tests pass, run `/verify` to drive the affected flow and observe real behavior — tests and typecheck aren't enough. If `/verify` isn't green, the build isn't done.

## Rules

- Follow the project's normal coding and testing standards while implementing (the usual rule files still apply — this skill doesn't override them).
- Stay inside the plan's Scope boundary the whole way through. If you spot necessary follow-up work, add it as a new unchecked task or a note — don't expand silently.
- If the plan is wrong, ambiguous, or contradicts the codebase, stop and ask rather than guessing.
- Keep the plan file updated as you go: checked boxes, plus a short note on any task you had to deviate on and why.
- When every task is checked, tests pass, the refactor pass has run, and `/verify` is green, summarize what was done and flag anything left deferred.

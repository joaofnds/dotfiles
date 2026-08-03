---
name: build
description: >
  Pick up an implementation plan written by /plan (or any .boris/plans/*.md plan)
  and execute it faithfully in a fresh session. Invoke when the user points at a
  plan file and wants it built — "build @.boris/plans/...", "implement this plan",
  "resume", "pick up where we left off". Takes the plan path as an argument, and
  asks which plan when given none. Skip when .boris/plans/ holds no plan yet (use
  /plan) — the chain's input docs, spec/options/grilled/diagnosis and the status
  roll-up, are not plans. Skip too when in-flight state was handed off with no
  plan: resume from the .boris/handoffs/ briefing instead.
argument-hint: "Path to the .boris/plans/ plan file"
---

# Build

**Wrong skill if:** `.boris/plans/` holds no plan yet → `/plan` (the chain's `-spec`, `-options`, `-grilled`, `-diagnosis`, and `-status` docs live there too, and none of them is a plan); in-flight state was handed off with no plan → resume from the `.boris/handoffs/` briefing.

Given no plan path as argument, list the plan files in `.boris/plans/` (those without a `-spec`/`-options`/`-grilled`/`-diagnosis`/`-status` suffix) and ask which one to build. A `-status.md` file is the chain's roll-up view, not a plan: read it to see which milestone is next, then build that milestone's plan.

Execute an implementation plan written by `/plan` in a previous session. The plan is the source of truth — you have no memory of the conversation that produced it, so trust the file, not assumptions. Implementation is test-driven: cross-boundary vertical slices start outside-in; local behavior starts at the narrowest observable layer.

## Steps

1. **Read the whole plan first — and every artifact it cites.** Don't start on task 1 until you've read every section — Scope, Approach, Current state, Gotchas, and the task tracker all constrain how you implement. Then follow the plan's citations (spec, grilled doc, options, diagnosis, design file) and read those too: the acceptance criteria live in the spec, not the plan, and you can't honor a scope boundary you've never read. For UI work, the ratified palette and type live in `.boris/design/`, not the plan — derive every color and type decision from that file rather than choosing one. If the plan records that no direction was ratified, build on `coding_style_frontend.md`'s floor and invent no palette; if the plan says neither, stop and ask.
2. **Reality-check before touching anything.** Confirm the files and `file:line` references in "Current state". Stop for drift that changes scope, behavior, or approach. Record harmless path or sequencing corrections in the plan and continue.
3. **Work the task tracker top to bottom, in order.** Do one item at a time, executing it via the loop in step 4, then flip it to `- [x]` in the plan file before moving on — so progress survives if this session also dies.
4. **Execute each task test-first.** Read `~/.agents/rules/testing/00-index.md` and the modules it routes to. Start a cross-boundary vertical slice outside-in; start local behavior at the narrowest observable layer. Follow the gatekeeper's scenario-list and prediction/reconciliation loop, capturing predicted and observed results for each red/green step. Use intermediate deeper-red steps only when they reduce uncertainty.

   Every iteration produces visible evidence: the red output before the change, the green (or deeper-red) output after. Writing the task's code first and backfilling tests is the exact failure this loop exists to prevent — if you catch yourself doing it, stop and restart the task from the failing test. A task with no runtime-observable behavior (config, docs, tooling) skips the loop; its own confirmation step is the verification.
5. **Run the testing strategy once every task is checked.** Use the exact test command the plan names. Steps 5–7 run once, at the end — not per task.
6. **Refactor pass on green.** Reread the diff and remove complexity, duplication, or poor naming introduced or exposed by this change when the present benefit is demonstrated. Do not add future-facing abstractions. Rerun affected tests.
7. **Verify before declaring done.** Execute every acceptance-criterion check from the plan and capture the observed output. Route each criterion by what its check is:
    - **A runnable check** → `/verify-this`: it turns the capture into a falsifiable claim with a baseline/treatment comparison instead of a loose "ran it, looked fine."
    - **A named manual verification** — the deployed app behaving correctly end-to-end → stop and ask the user to run `/verify` against the spec; it is user-invoked only, and a `/verify-this` verdict does not stand in for it.
    - **A visual criterion against a `.boris/design/` file** → run that file's **Verify** checks and report what the screenshots showed. Rereading your own code and concluding it matches the tokens is not evidence. If you cannot render, the criterion is NOT VERIFIED.

    If any criterion lacks evidence, fails, or comes back NOT VERIFIED or INCONCLUSIVE, the build is not done.

## Rules

- Follow the project's normal coding and testing standards while implementing (the usual rule files still apply — this skill doesn't override them).
- Stay inside the plan's Scope boundary the whole way through. If you spot necessary follow-up work, add it as a new task marked `- [ ] DEFERRED —` so it reads as out of scope rather than as unbuilt work — don't expand silently.
- If the plan is wrong, ambiguous, or contradicts the codebase, stop and ask rather than guessing. Under-specification is divergence too: when a task forces you to design something the plan never settled — a new type, an API surface, a dependency — surface the design and get it ratified before building it. A `DESIGN:` note on the task records the decision; it doesn't authorize it.
- Keep the plan file updated as you go: checked boxes, plus a short note on any task you had to deviate on and why.
- When every task is checked, tests pass, the refactor pass has run, and every acceptance criterion has execution evidence, **close the plan out before you summarize.** Write a closeout at the top of the plan file, directly under the title:

      **Status:** built | partial | abandoned — YYYY-MM-DD

      ## Closeout
      - **Landed:** what shipped, in one line per milestone.
      - **Not landed:** each unbuilt task, and the reason — descoped, superseded, blocked.
      - **Left over:** work still wanted, each item carrying its `reporting_findings.md` disposition
        and the trigger Blocking and Decide require. **Blocking** and **Decide** items name
        where they went — a new plan under `.boris/plans/`, or an issue — and creating either
        needs the user's go-ahead first, so ask for it in the summary. **Noted** items stay
        listed here under one heading and are routed nowhere. The archive is not a queue.
      - **Next:** the first of these that applies —
        - `fix <X> first` — Status is `partial`, or a **Blocking** item survives.
        - `stopped — <why>` — Status is `abandoned`.
        - `your call on <Y>` — an open **Decide** item changes what the next milestone builds.
        - `proceed to <next milestone>` — none of the above, and a milestone remains.
        - `done — nothing follows` — none of the above, and this was the last or only plan.

  The **Next:** line is also the first line of your summary to the user. Learning whether the
  next milestone is safe to start must not require opening the plan file.

  If the plan cites a status file, or a `<date>-<slug>-status.md` exists in `.boris/plans/` for
  this plan's date-and-slug prefix (drop any `-<N>-<milestone>` suffix before matching), update
  it in the same pass: flip this milestone to `[x]`, or to `[~]` with the missing piece named
  when the closeout says `partial` or a **Blocking** item survives. Move the closeout's open
  **Decide** items under **Needs your attention**, tagged with this milestone. Leave **Noted**
  items out of it. A closed-out milestone whose status line still reads `[ ]` is the drift this
  file exists to prevent.

  Then archive the whole chain of documents that led to the plan, not just the plan: every artifact sharing its stem — `-spec`, `-options`, `-grilled`, `-design`, `-diagnosis`, `-status`, and the numbered milestone plans — plus that stem's entries under `.boris/reviews/`, `.boris/handoffs/`, and `.boris/design/`. Each moves to the mirrored `.boris/archive/<subdir>/` (`git mv` when tracked, `mv` otherwise). A plan stopped mid-flight archives the same way — `partial` or `abandoned`, with the reason in the closeout. Only in-flight work stays outside `.boris/archive/`.

  When a stem carries several milestone plans, archive the chain only once the last one is closed out — the shared spec and grilled docs are still live for the milestones that remain.
- A citation to `.boris/<subdir>/<name>.md` that doesn't resolve is looked up at `.boris/archive/<subdir>/<name>.md` before being treated as missing. Never repoint an existing citation on archive.

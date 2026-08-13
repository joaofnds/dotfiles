---
name: build
disable-model-invocation: true
description: >
  Pick up an implementation plan written by /plan (or any .boris/plans/*.md plan)
  and execute it faithfully in a fresh session. Invoke when the user points at a
  plan file and wants it built — "build @.boris/plans/...", "implement this plan",
  "resume", "pick up where we left off". Takes the plan path as an argument, and
  asks which plan when given none. Commits its work as it goes — each task, the
  refactor pass, and any fix the final checks force; invoking it is the go-ahead
  for those commits. Skip when .boris/plans/ holds no plan yet (use
  /plan) — the chain's input docs, spec/options/grilled/design/diagnosis and the status
  roll-up, are not plans. Skip too when in-flight state was handed off with no
  plan: resume from the .boris/handoffs/ briefing instead.
argument-hint: "Path to the .boris/plans/ plan file"
---

# Build

Given no plan path, list `.boris/plans/*.md` without a `-spec`/`-options`/`-grilled`/`-design`/`-diagnosis`/`-status` suffix and ask which to build. A `-status.md` is the chain's roll-up: read it for the next milestone, then build that milestone's plan.

The plan is the source of truth — you have no memory of the conversation that produced it, so trust the file, not assumptions.

## Steps

1. **Read the whole plan first — and every artifact it cites.** Don't start on task 1 until you've read every section — Scope, Approach, Current state, Gotchas, and the task tracker all constrain how you implement. Then follow the plan's citations (spec, grilled doc, options, diagnosis, design file) and read those too: the acceptance criteria live in the spec, not the plan, and you can't honor a scope boundary you've never read. Read `.boris/CONTEXT.md` whether or not the plan cites it — naming things outside its vocabulary is how a correct change reads as foreign. For UI work, the ratified palette and type live in `.boris/design/`, not the plan — derive every color and type decision from that file rather than choosing one. If the plan records that no direction was ratified, build on `coding_style_frontend.md`'s floor and invent no palette; if the plan says neither, stop and ask.
2. **Reality-check before touching anything.** Confirm the files and `file:line` references in "Current state". Stop for drift that changes scope, behavior, or approach. Record harmless path or sequencing corrections in the plan and continue.
3. **Work the task tracker top to bottom, in order.** Before you touch any file in this step, run `git status --porcelain` and record every path already dirty; if a task's files later include one of those paths, name it and ask before committing that task — dirty paths you never touch need no ask, the pathspec below already excludes them. Do one item at a time, executing it via the loop in step 4, then flip it to `- [x]` in the plan file — it lives in git-ignored `.boris/`, and the pathspec below keeps it out of the commit either way — and commit the task's source changes before moving on. The tracker flip is what a dead session picks up from; the commit is what makes the slice a checkpoint: a later failure is diagnosed against the last green commit, not against the whole feature. One commit per completed task that changed files — a task that changed none commits nothing; say so — and one per later change steps 5–7 force; a task that skipped step 4's loop commits once its own confirmation step passes. Stage exactly the task's paths (`git add -- <the task's files>`), then commit with the same pathspec (`git commit -m "<subject>" -- <the task's files>`) so nothing already staged is swept in — never `git add -A`, never `git commit -a` — with a subject matching the repo's commit-subject style (skim `git log --oneline -20` before the first commit). Invoking this skill is the user's standing direction to make these commits — per task, and for the later changes steps 5–7 force — don't re-ask for each one. That is the authorization `ownership.md` requires, and it reaches no further: no `push`, `revert`, `reset`, `amend`, or `rebase`, and no file outside the change you just made — ask for those.
4. **Execute each task test-first.** Read `~/.agents/rules/testing/00-index.md` and the modules it routes to. Start a cross-boundary vertical slice outside-in; start local behavior at the narrowest observable layer. Follow the gatekeeper's scenario-list and prediction/reconciliation loop, capturing predicted and observed results for each red/green step. Use intermediate deeper-red steps only when they reduce uncertainty.

   Every iteration produces visible evidence: the red output before the change, the green (or deeper-red) output after. Writing the task's code first and backfilling tests is the exact failure this loop exists to prevent — if you catch yourself doing it, stop and restart the task from the failing test. A task with no runtime-observable behavior (config, docs, tooling) skips the loop; its own confirmation step is the verification.
5. **Run the testing strategy once every task is checked.** Use the exact test command the plan names. Steps 5–7 run once, at the end — not per task. Any code change they force — a fix for a failing strategy run, or one that a step 7 criterion's evidence exposes — is its own commit, on step 3's terms.
6. **Refactor pass on green.** Reread the diff and remove complexity, duplication, or poor naming introduced or exposed by this change when the present benefit is demonstrated. Do not add future-facing abstractions. Rerun affected tests. If the pass changed anything, commit it as its own commit on step 3's terms; a pass that changed nothing commits nothing — say so.
7. **Verify before declaring done.** Every acceptance criterion in the plan gets evidence. Route each criterion by what its check is — the route decides who produces that evidence and what counts as it:
    - **A runnable check** → `/verify-this`: it turns the capture into a falsifiable claim with a baseline/treatment comparison instead of a loose "ran it, looked fine."
    - **A named manual verification** — the deployed app behaving correctly end-to-end → stop, and hand the user the check in the reply: the steps to exercise, the environment to exercise them in, and the spec line that says what a pass looks like. Resume when they report what they observed. A report is the observation only when it names what they did and what they saw, in terms that decide that spec line true or false — a bare verdict ("looks fine"), or an observation of a different flow, is not; ask what they saw. Quote their answer in the reply that resumes work, and paste that quote into the plan beside the task the criterion covers — your paraphrase of what they must have seen is not the observation. A `/verify-this` verdict does not stand in for it.
    - **A visual criterion against a `.boris/design/` file** → run that file's **Verify** checks and report what the screenshots showed. Rereading your own code and concluding it matches the tokens is not evidence. If you cannot render, the criterion is NOT VERIFIED.

    If any criterion lacks evidence, fails, or comes back NOT VERIFIED or INCONCLUSIVE, the build is not done — the one exception is a criterion you handed the user under the manual-verification route above and that they then closed out without reporting an observation, which §Rules closes out as `partial`. A criterion you never handed over gets no exception.

## Rules

- Stay inside the plan's Scope boundary the whole way through. If you spot necessary follow-up work, add it as a new task marked `- [ ] DEFERRED —` so it reads as out of scope rather than as unbuilt work — don't expand silently. A `DEFERRED` line is scope you are not building, not unbuilt work: step 3 skips it, the "every task is checked" gates in step 5 and at closeout ignore it, and **Not landed** never claims it. It goes to **Left over** at closeout as a **Noted** item with its one-line reason, or **Decide** where it changes what the next milestone builds. Unlike an `AWAITING` line it stays in the tracker.
- If the plan is wrong, ambiguous, or contradicts the codebase, stop and ask rather than guessing. Under-specification is divergence too: when a task forces you to design something the plan never settled — a new type, an API surface, a dependency — surface the design and get it ratified before building it. A `DESIGN:` note on the task records the decision; it doesn't authorize it.
- Keep the plan file updated as you go: checked boxes, plus a short note on any task you had to deviate on and why.
- **A criterion routed to the user and not yet answered is not a closeout state.** Write no closeout, leave the status file's milestone marker alone, archive nothing, and add `- [ ] AWAITING — <criterion>: <what you asked them to exercise>` to the task tracker, so the next session finds the pending check without the conversation. An `AWAITING` line is a check for the user, not work: step 3 skips it, the "every task is checked" gates in step 5 and at closeout ignore it, and **Not landed** never claims it. Delete the line when they report the observation, or when a closeout claims the criterion under **Left over**. Lead the summary with `waiting on your check of <X>`. If the user closes out without observing it, Status is `partial` and the closeout bullet below applies.
- When every task is checked, tests pass, the refactor pass has run, every source change this session made is committed (`git status --porcelain` shows nothing beyond the paths recorded dirty at step 3's baseline), and every acceptance criterion has the evidence step 7 requires — captured output for a check you ran, or the user's reported observation for a criterion routed to them, or, for a criterion the user closed out unobserved, a **Left over** entry reading `unverified — <criterion>` in place of evidence — **close the plan out before you summarize.** Write a closeout at the top of the plan file, directly under the title:

      **Status:** built | partial | abandoned — YYYY-MM-DD

      ## Closeout
      - **Landed:** what shipped, in one line per milestone.
      - **Not landed:** each unbuilt task, and the reason — descoped, superseded, blocked.
      - **Left over:** work still wanted, each item carrying its `reporting_findings.md` disposition
        — the trigger where the item is a defect, a one-line reason where it is deferred
        work. **Blocking** and **Decide** items name
        where they went — a new plan under `.boris/plans/`, or an issue — and creating either
        needs the user's go-ahead first, so ask for it in the summary. **Noted** items stay
        listed here under one heading and are routed nowhere. The archive is not a queue.
        An acceptance criterion the user closed out without observing is a **Decide** item — a
        result is unverified (`reporting_findings.md` §Dispositions) whose probe you could not
        run. List it as `unverified — <criterion>`, naming the check they would have to run in
        place of a destination; it is the one **Decide** item that names no new plan or issue.
        Where archiving this closeout would leave no live artifact holding the check — a
        single-milestone stem, or the last milestone — say so in the summary and ask whether
        to file it before you archive.
      - **Next:** the first of these that applies —
        - `stopped — <why>` — Status is `abandoned`.
        - `unverified — <X>` — Status is `partial` only because the user closed out an
          unobserved criterion, and no **Blocking** item survives.
        - `fix <X> first` — Status is `partial`, or a **Blocking** item survives.
        - `your call on <Y>` — an open **Decide** item changes what the next milestone builds.
        - `proceed to <next milestone>` — none of the above, and a milestone remains.
        - `done — nothing follows` — none of the above, and this was the last or only plan.

  The **Next:** line is also the first line of your summary to the user, and where no closeout
  was written the `waiting on your check of <X>` line takes its place. Learning whether the
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

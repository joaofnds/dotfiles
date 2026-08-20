---
name: build
disable-model-invocation: true
description: >
  Pick up a card whose plan doc /plan wrote and execute it faithfully in a fresh
  session. Invoke when the user points at a card (or its plan doc) and wants it
  built: "build TASK-3", "implement this plan", "resume", "pick up where we left
  off". Takes the card ID as an argument, and asks which card when given none.
  Commits its work as it goes: each task, the refactor pass, and any fix the final
  checks force; invoking it is the go-ahead for those commits. Skip when the card
  has no plan doc attached yet (use /plan); the chain's other docs,
  spec/options/grilled/design/diagnosis, are not plans.
argument-hint: "Card ID (or plan doc) to build"
---

# Build

The stage column is Build. Given no card ID, run `backlog task list` and ask which card to build. For
a milestone parent, build the first not-yet-Done child whose dependencies are Done,
never the parked parent.

The plan doc attached to the card is the source of truth; you have no memory of
the conversation that produced it, so trust the file, not assumptions.

## Steps

1. **Read the whole plan first, and every other doc on the card.** Don't start on
   task 1 until you've read every section: Scope, Approach, Current state,
   Gotchas, and the task tracker all constrain how you implement. Then read the
   card's other attached docs and refs (spec, grilled doc, options, diagnosis,
   design doc) too; for a milestone child those hang on the parent card
   (`parentTaskId`), so read the parent's attached docs as well: the
   acceptance criteria live on the card itself,
   and you can't honor a scope boundary you've never read. Read
   `.boris/CONTEXT.md` whether or not the plan cites it; naming things
   outside its vocabulary is how a correct change reads as foreign. For UI
   work, the ratified palette and type live in the design doc attached to the
   card ("<feature> design"), not the plan; derive every color and type
   decision from that doc rather than choosing
   one. If the plan records that no direction was ratified, build on
   `coding_style_frontend.md`'s floor and invent no palette; if the plan says
   neither, stop and ask.
2. **Reality-check before touching anything.** Confirm the files and
   `file:line` references in "Current state". Stop for drift that changes
   scope, behavior, or approach. Record harmless path or sequencing
   corrections in the plan and continue.
3. **Work the task tracker top to bottom, in order.** Before you touch any
   file in this step, run `git status --porcelain` and record every path
   already dirty; if a task's files later include one of those paths, name it
   and ask before committing that task; dirty paths you never touch need no
   ask, the pathspec below already excludes them. Do one item at a time,
   executing it via the loop in step 4, then flip it to `- [x]` in the plan
   doc (it lives in git-ignored `backlog/`, and the pathspec below keeps it
   out of the commit either way), and commit the task's source changes before
   moving on. The tracker flip is what a dead session picks up from; the
   commit is what makes the slice a checkpoint: a later failure is diagnosed
   against the last green commit, not against the whole feature. One commit
   per completed task that changed files (a task that changed none commits
   nothing; say so), and one per later change steps 5–7 force; a task that
   skipped step 4's loop commits once its own confirmation step passes. Stage
   exactly the task's paths (`git add -- <the task's files>`), then commit
   with the same pathspec (`git commit -m "<subject>" -- <the task's files>`)
   so nothing already staged is swept in, never `git add -A`, never
   `git commit -a`, with a subject matching the repo's commit-subject style
   (skim `git log --oneline -20` before the first commit). Invoking this
   skill is the user's standing direction to make these commits, per task,
   and for the later changes steps 5–7 force, don't re-ask for each one.
   That is the authorization `ownership.md` requires, and it reaches no
   further: no `push`, `revert`, `reset`, `amend`, or `rebase`, and no file
   outside the change you just made; ask for those.
4. **Execute each task test-first.** Read
   `~/.agents/rules/testing/00-index.md` and the modules it routes to. Start
   a cross-boundary vertical slice outside-in; start local behavior at the
   narrowest observable layer. Follow the gatekeeper's scenario-list and
   prediction/reconciliation loop, capturing predicted and observed results
   for each red/green step. Use intermediate deeper-red steps only when they
   reduce uncertainty.

   Every iteration produces visible evidence: the red output before the
   change, the green (or deeper-red) output after. Writing the task's code
   first and backfilling tests is the exact failure this loop exists to
   prevent; if you catch yourself doing it, stop and restart the task from
   the failing test. A task with no runtime-observable behavior (config,
   docs, tooling) skips the loop; its own confirmation step is the
   verification.
5. **Run the testing strategy once every task is checked.** Use the exact
   test command the plan names. Steps 5–7 run once, at the end: not per
   task. Any code change they force, a fix for a failing strategy run, or
   one that a step 7 criterion's evidence exposes, is its own commit, on
   step 3's terms.
6. **Refactor pass on green.** Reread the diff and remove complexity,
   duplication, or poor naming introduced or exposed by this change when the
   present benefit is demonstrated. Do not add future-facing abstractions.
   Rerun affected tests. If the pass changed anything, commit it as its own
   commit on step 3's terms; a pass that changed nothing commits nothing;
   say so.
7. **Verify before declaring done.** Every acceptance criterion on the card
   gets evidence, and is checked on the card (`backlog task edit <id>
   --check-ac <n>`) the moment its evidence exists: never before, never in a
   batch at closeout. Route each criterion by what its check is; the route
   decides who produces that evidence and what counts as it:
    - **A runnable check** → `/verify-this`: it turns the capture into a
      falsifiable claim with a baseline/treatment comparison instead of a
      loose "ran it, looked fine."
    - **A named manual verification**: the deployed app behaving correctly
      end-to-end → stop, and hand the user the check in the reply: the steps
      to exercise, the environment to exercise them in, and the spec line
      that says what a pass looks like. Resume when they report what they
      observed. A report is the observation only when it names what they did
      and what they saw, in terms that decide that spec line true or false;
      a bare verdict ("looks fine"), or an observation of a different flow,
      is not; ask what they saw. Quote their answer in the reply that resumes
      work, and paste that quote into a card note beside the criterion it
      closes; your paraphrase of what they must have seen is not the
      observation. A `/verify-this` verdict does not stand in for it.
    - **A visual criterion against the card's design doc** → run that
      doc's **Verify** checks and report what the screenshots showed.
      Rereading your own code and concluding it matches the tokens is not
      evidence. If you cannot render, the criterion is NOT VERIFIED.

    If any criterion lacks evidence, fails, or comes back NOT VERIFIED or
    INCONCLUSIVE, the build is not done; the one exception is a criterion
    you handed the user under the manual-verification route above and that
    they then closed out without reporting an observation, which §Rules
    closes out under the `partial` label. A criterion you never handed over
    gets no exception.

## Rules

- Stay inside the plan's Scope boundary the whole way through. If you spot
  necessary follow-up work, don't expand silently: record it as a card note,
  or as its own card when it warrants its own context, criteria, or docs (the
  size rule, `backlog_board.md` §Milestones), with its one-line reason, so it reads
  as out of scope rather than as unbuilt work. It is scope you are not
  building: step 3 never executes it, the "every task is checked" gates in
  step 5 and at closeout ignore it, and the final summary's Landed line never
  claims it. At closeout it routes as a left-over item by its disposition.
- If the plan is wrong, ambiguous, or contradicts the codebase, stop and ask
  rather than guessing. Under-specification is divergence too: when a task
  forces you to design something the plan never settled, a new type, an API
  surface, a dependency, surface the design and get it ratified before
  building it. A `DESIGN:` note on the task records the decision; it doesn't
  authorize it.
- Keep the plan doc updated as you go: checked boxes, plus a short note on
  any task you had to deviate on and why.
- **A criterion routed to the user and not yet answered is not a closeout state.**
  Close nothing out: leave the criterion unchecked, leave the card in Build,
  and add a card note naming the criterion and what you asked them to
  exercise, so a fresh session finds the pending check without the
  conversation. Lead the summary with `waiting on your check of <X>`. When
  they report the observation, check the criterion with their quoted answer
  (step 7) and delete the note. If the user closes out without observing it,
  the closeout bullet below applies with the `partial` label.
- When every task is checked, tests pass, the refactor pass has run, every
  source change this session made is committed (`git status --porcelain`
  shows nothing beyond the paths recorded dirty at step 3's baseline), and
  every acceptance criterion on the card is checked with the evidence step 7
  requires (or the user directed a `partial`/`abandoned` label, with the
  reason in the final summary), **close the card out before you summarize**,
  on `backlog_board.md` §Closeout terms:

  - Write `--final-summary` with **Landed** (what shipped, one line per
    milestone) and **Next**: the first of these that applies:
    - `stopped: <why>`: the card carries the `abandoned` label.
    - `unverified: <X>`: `partial` only because the user closed out an
      unobserved criterion, and no **Blocking** item survives.
    - `fix <X> first`: the card carries `partial`, or a **Blocking** item
      survives.
    - `your call on <Y>`: an open **Decide** item changes what the next
      milestone builds.
    - `proceed to <next milestone>`: none of the above, and a milestone
      remains.
    - `done: nothing follows`: none of the above, and this was the last or
      only card.
  - Route left-over items by their `reporting_findings.md` disposition, per
    `backlog_board.md` §Closeout: each carries the trigger where it is a defect, a
    one-line reason where it is deferred work. An acceptance criterion the
    user closed out without observing is a **Decide** item, a result
    unverified whose probe you could not run: record it as
    `unverified: <criterion>`, naming the check they would have to run; it
    is the one **Decide** item that needs no new card, only their check.
  - Move the card to Done (`backlog task edit <id> -s Done`),
    guard-checked. Nothing archives: the card and its docs stay where they
    are.
  - When that move makes every child of the parent Done, close the parent the
    same way: roll-up final summary, remaining criteria checked with the
    children's evidence (complete only now, so step 7's no-batch rule is not
    breached), then `-s Done`, guard-checked.

  The **Next** line is also the first line of your summary to the user, and
  where no closeout happened the `waiting on your check of <X>` line takes
  its place. Whether the next milestone is safe to start must not require
  opening any doc: its dependency card being Done is the signal.
- A citation in a surviving doc to `.boris/<subdir>/<name>.md` that doesn't
  resolve is looked up at `.boris/archive/<subdir>/<name>.md` before being
  treated as missing. Never repoint the citation.

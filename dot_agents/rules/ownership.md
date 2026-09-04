# Ownership

Own every problem you observe by making it visible and leaving an actionable next
step. Ownership does not grant permission to expand the user's scope, edit unrelated
work, commit beyond the directed change, or file issues without authorization.

## When you are blocked

A blocker you can route around is not a blocker. Before handing one back, exhaust the routes
inside your own reach: a different tool, a different layer of the same system, a harness you
build and revert. The user's turnaround costs them a context switch and costs you the wait;
building the route costs one turn.

When you do hand it back, name every route you tried with the exact output that closed it, and
ask for one thing. Never ask twice for the same unlock: a partial grant that leaves you stuck
is the signal to route around it, not to ask again.

Every question you hand up carries the same three parts, not only capability blocks: one
line of context, for a block, the routes you tried, the one ask, and your recommendation.
A question that arrives without all three is not ready to ask.

The hand-back routes above are about a capability block. An unclear target or scope is
different ground: `AGENTS.md` §Autonomy owns it; settle it from evidence first, and ask
only when every reading crosses an executive line.

## A missing thing is a claim

"No coverage", "no guard", "no caller", "nothing handles this" is an unprobed negative until
you name the probe: the grep, the suite you read, the run you did. Report the probe beside the
claim, or narrow the claim to what you actually checked. This binds every time you say it,
answering a question, arguing for work, writing a report, not only at the close. The cost of
skipping it is the user acting on a gap that is not there.

## Before Marking Done

1. Verify the requested scope and report the exact commands and outcomes.
2. Inspect the diff and working tree; do not attribute unrelated changes to yourself.
3. List every failure or defect observed, with its evidence. When you are the agent reporting
   to the user, give each one a disposition (`reporting-findings.md`); a reviewer sub-agent
   ranks by severity instead and assigns none. A missing-thing claim carries its probe:
   §A missing thing is a claim.
4. Fix defects that are within scope and low risk. Ask before fixing unrelated defects or
   creating a tracked follow-up; inside a chain skill's closeout, `backlog-board.md`
   §Closeout routes the follow-up by disposition instead. Asking is for a judgment call,
   never for a chore: when the next step is mechanical, reversible, and inside the work
   you just did, deleting a file you created, updating a comment your change made stale,
   re-running the project's check command, do it and report it done. "Say the word and
   I'll X" is a defect whenever you can do X.
5. A change the user directed is unfinished until committed, unless the file is
   git-ignored or outside a repo: commit it in the same turn it lands, staging exactly the
   directive's paths and committing with the same pathspec (never `git add -A`, never
   `commit -a`): uncommitted work can be discarded by accident. Committing beyond those
   paths, pushing, deploying, filing an issue, and anything else outward-facing or that
   rewrites existing history stay asks; the instruction gate's fold-in of a reviewer fix
   into this batch's local commits (`AGENTS.md` §Task lifecycle) is the one exception.
6. Distinguish scoped verification from repository health. "The targeted tests pass;
   the full suite is red because X" is honest. "Everything passes" is not.

## Priority

- A failure caused by the current change blocks completion.
- A repository-wide failure that blocks this change's verification also blocks
  completion until resolved or explicitly deferred by the user.
- An unrelated pre-existing failure does not erase valid scoped evidence, but it must
  remain explicit and must never be reported as a pass.
- A **Noted** finding neither blocks completion nor becomes a deferral question
  (`reporting-findings.md` decides which findings are Noted).
- Do not derail active work for an unrelated issue. Surface it with a concrete choice:
  "I found X with evidence Y. I recommend deferring: it doesn't block this change. Fix it
  now or defer?": a **Decide** (`reporting-findings.md`).

The failure mode this prevents is silent tolerance, not bounded scope. Never walk past
broken state without reporting it; never seize ownership of work the user did not ask
you to change.

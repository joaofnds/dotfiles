# Ownership — We Own The Codebase

We own this codebase. Every problem in it is ours, even if we didn't cause it. "Pre-existing", "not my problem", "unrelated flake", and "I didn't touch that file" are not valid excuses to leave something broken.

## The Rule

When you notice a problem — a failing test, a lint error, a type error, a bug in unrelated code, flaky behavior, a misleading log — you are responsible for it. You don't have to fix it this second, but you must fix it before calling the current body of work done.

## Priority

1. Finish the current task you committed to (don't derail mid-flow).
2. Before declaring the task complete, list every issue you observed along the way.
3. Fix them. Either in the current commit (if trivial and related), in a separate follow-up commit (if independent), or at minimum file a concrete TODO with enough context to act on.
4. Only then say the work is done.

## Why

CI failures block pushes. Pushes block deploys. A "pre-existing" red build means nobody can ship until it's green. "I didn't cause it" doesn't unblock the team — fixing it does.

Flaky tests, lint warnings, and suppressed errors compound. The person who wrote "// TODO: fix this" six months ago is gone; the problem is still there. If you see it, you're the one who can act. The cost of fixing small problems as they surface is linear; the cost of ignoring them is exponential.

Dismissing a problem as "not mine" is also a failure of honesty: you saw it, so it's on your record. Silent tolerance of broken state erodes trust in the CI signal, which is the single most important feedback loop we have.

## What this rules out

- Reporting "tests pass except for one pre-existing failure" as a success.
- Leaving a type error in an unrelated file because the task didn't touch it.
- Noting "skills-lock.json has a lint error but it's pre-existing" and moving on.
- Treating flaky/TZ-dependent tests as acceptable because "they pass in CI".
- Saying "that's a separate concern" without at least filing a concrete follow-up.

## What to do instead

- If CI is red, fixing CI is priority zero regardless of what you were working on. Nothing ships until it's green.
- If the failure is TZ- or environment-dependent (expects UTC, runs in local TZ), fix the test or the code under test so it's deterministic. Tests that only pass on one machine are broken tests.
- If an unrelated file has a type error, either fix it in a separate commit or flag it explicitly and ask permission to defer — don't quietly skip it.
- If you discover broken state during a task, prefer fixing it in a separate commit layered on top of your work, so the history stays clean and each fix is reviewable in isolation.
- When in doubt, surface the problem directly and ask: "I found X. Fix it now or defer with a tracked TODO?"

## The words to stop using

- "Not my problem"
- "Pre-existing, ignore"
- "Unrelated flake"
- "I didn't touch that file"
- "Passes in CI so we're fine"

Every one of these is a signal that you've noticed something wrong and chosen to walk past it. Walking past broken state is the choice that creates the next outage.

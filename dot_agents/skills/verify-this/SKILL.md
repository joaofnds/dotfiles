---
name: verify-this
description: >
  Turn a claim about behavior into a verdict backed by fresh, comparable evidence — restate
  it falsifiably, capture baseline and treatment, and return VERIFIED, NOT VERIFIED, or
  INCONCLUSIVE. Invoke on "verify this", "prove it works", "did this fix it", "show me the
  evidence" — or whenever declaring a fix or feature done rests on a runtime claim tests
  only half-cover. Not for the deployed app end-to-end (/verify, user-invoked, third-party)
  and not for finding an unconfirmed cause (/debug) — this is for a specific claim you can
  gather evidence for yourself, right now, in this session.
---

# Verify This

**Wrong skill if:** the claim is "does the shipped, deployed app behave correctly
end-to-end" — that's `/verify`, a separate user-invoked-only skill; ask the user to run it
rather than substituting this one. A `/verify-this` verdict never stands in for it. Also
wrong when the cause isn't confirmed yet — that's `/debug`; this skill checks a claim, it
doesn't find one. Also wrong for a vague claim ("the code is cleaner", "this feels
right") — get a measurable claim first, or say why one isn't obtainable here.

Verification is not a recap of what you did. It's evidence that one specific, falsifiable
claim holds, gathered fresh, reported as one of three verdicts — never softened into a
fourth.

## Restate the claim

Before touching anything, rewrite the claim as *condition → metric → threshold*. "The fix
works" isn't falsifiable; "under concurrent writes, the retry succeeds within 3 attempts"
is. If the user's claim doesn't reduce to this shape, ask what would prove it wrong before
gathering evidence — guessing the threshold defeats the point (engineering_judgment.md §1,
facts before theories).

## Baseline, then treatment

Prefer a repo-native harness for the surface — its own test runner, e2e suite, demo
script — over an ad hoc one, and use only what this session actually has: `Bash` for CLI,
API, and unit-test evidence; browser or simulator control tooling for a UI claim *if this
session exposes it*. If the only surface that could disprove the claim needs a capability
you don't have, return INCONCLUSIVE naming the missing capability — never a described
observation you didn't make.

1. Pick the smallest local surface that could disprove the claim — a unit test, a repro
   script, a curl, a rendered screen, a profile.
2. Capture the *baseline*: the old state — parent commit, merge base, the failing repro,
   current behavior before the change.
3. Capture the *treatment*: the changed state, using the same command, data, warmup, and
   environment as the baseline. A baseline and treatment run under different conditions
   prove nothing — name the difference and downgrade to INCONCLUSIVE rather than paper
   over it.

## The failure modes this guards against

This skill exists because these happen by default — treat each as active, not
hypothetical. The first four mirror `engineering_judgment.md` §6 (edit both); "just
produced" below is this skill's stricter reading of §6's "only tool output counts":

- **Fabricated verification** — "tests pass" without having run them. Only tool output you
  just produced counts.
- **Stale verification** — a cached pass isn't a run. When the point is that something
  *changed*, bust the cache (`go test -count=1` and the like) and confirm the change
  actually landed before trusting the result.
- **Destroyed evidence** — restore a deliberately broken baseline from a copy you made;
  `git checkout <file>` also discards the treatment you came to compare against.
- **Narrative continuity** — a confident summary that matches the session's direction even
  when the evidence diverged. The artifacts are truth, not the story so far.

## Verdict

Exactly one of:

- **VERIFIED** — baseline and treatment differ in the predicted direction, past the stated
  threshold, with no confound you can name.
- **NOT VERIFIED** — unchanged, wrong direction, or short of the threshold. Report this as
  plainly as a pass — a clean NOT VERIFIED is the useful outcome, not a failure to soften.
- **INCONCLUSIVE** — no valid baseline, a noisy signal, a failed capture, a missing
  capability, or any confound you can name that could account for the delta. Say which,
  and what would resolve it.

Report:

```
VERIFIED | NOT VERIFIED | INCONCLUSIVE
Claim: <the falsifiable restatement>
Evidence: baseline=<...>  treatment=<...>  delta=<...>  threshold=<...>
Confounds: <named, or "none identified">
```

Artifacts that don't fit inline — screenshots, transcripts, profiles — go to
`/tmp/verify-this/<claim-slug>/`. This is throwaway evidence for one claim, not a durable
plan or review doc, so it does not belong under `.boris/`. Skip writing to disk anything
that would expose secrets, customer data, or credentials from the session; keep only the
minimal inline evidence instead.

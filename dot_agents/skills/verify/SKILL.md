---
name: verify
description: Turns a claim about behavior into a verdict backed by fresh evidence, by restating the claim falsifiably, capturing a baseline and a treatment under the same conditions, and returning verified, not verified, or inconclusive. Use when a claim needs proof and you can gather it yourself in this session. A cause that is not yet known goes to debug instead.
---

# Verify

A claim about behavior is settled by evidence you produced in this session, from a
baseline and a treatment that differ only in the change under test.

## Restate the claim so it can fail

Rewrite the claim as a condition, a metric, and a threshold. "The fix works" cannot
fail. "Under concurrent writes the retry succeeds within three attempts" can. Where
the claim does not reduce to that shape, ask João what would prove it wrong before
gathering anything. Guessing the threshold decides the verdict in advance.

A claim about the deployed application end to end is his to check by hand. Say what
you need him to exercise, and never let a verdict here stand in for it.

## Baseline, then treatment

Pick the smallest surface that could disprove the claim: a unit test, a repro script,
one request, a rendered screen, a profile. Prefer the project's own runner or harness
over one you build.

Capture the baseline first, the state before the change: the parent commit, the merge
base, the failing reproduction. Then capture the treatment with the same command, the
same data, the same warmup, and the same environment. A difference between the two
runs that is not the change under test is a confound. Name it and return inconclusive
rather than reasoning past it.

Use only what this session has. Where the surface that could disprove the claim needs
a capability you lack, return inconclusive and name the capability. Never describe an
observation you did not make.

## The verdict

One of three. Report it in this form, with the confound line always present, since a
silent one reads the same as one you never looked for:

    verified | not verified | inconclusive
    claim: <the falsifiable restatement>
    evidence: baseline=<...> treatment=<...> delta=<...> threshold=<...>
    confounds: <named, or none identified>

- **Verified.** The two runs differ in the predicted direction, past the threshold,
  with no confound you can name.
- **Not verified.** Unchanged, the wrong direction, or short of the threshold. Report
  it as plainly as a pass. A clean not-verified is the useful answer.
- **Inconclusive.** No valid baseline, a signal too noisy to read, a failed capture, a
  missing capability, or a confound that could account for the delta. Say which, and
  what would settle it.

Evidence too large for the reply goes under the session's temporary directory, since
it belongs to one claim and not to the project. Keep secrets, customer data, and credentials out of anything you
write to disk.

## The failure modes this exists to catch

Reporting a result you did not produce is the first one, and this skill reads the
claims rule strictly: only tool output from this run counts, and a suite you did not
watch run is not evidence.

A cached pass is not a run. When the point is that something changed, bust the cache
and confirm the change is in the artifact you tested.

A deliberately broken baseline is restored from a copy you made. Checking the file out
of git also discards the treatment you came to measure.

A summary that matches where the session was heading is not evidence. The artifacts
are, and they are what you report.

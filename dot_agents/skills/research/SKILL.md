---
name: research
description: >
  Take a spec/PRD and survey genuinely different implementation options in this
  codebase, with pros/cons — leans toward one but does NOT decide (/grill converges,
  /plan writes it up). Invoke once a spec exists, before /grill: "research options for
  this spec". Takes the spec path as argument; no spec yet → /discuss first.
  Codebase-grounded only — a web-only report is the built-in deep-research. Skip when
  there's one sane implementation — go to /plan (or /grill if it needs hardening).
argument-hint: "Path to the spec/PRD to research options for"
metadata:
  trigger: A spec/PRD exists; research the codebase and survey implementation options before grilling
---

# Research

Take a spec and figure out the genuinely different ways to build it in *this* codebase.
The job is to widen the option space and ground it in reality — then lean, but don't
pick the winner. `/grill` converges off the doc you produce; `/plan` writes the
implementation. Don't write code here.

Read the spec first (the argument is its path). It is the source of truth for *what* is
needed — treat its scope, constraints, and acceptance criteria as fixed, and tie every
option back to them. If the spec is missing or ambiguous, stop and say so rather than
inventing requirements.

## How to run it

- **Ground in the codebase.** Read where the feature hooks in and what patterns already
  exist; cite `file:line`. An option you can't anchor to real code is a guess.
- **Question the premise.** Check whether the platform, framework, or an existing
  dependency already provides this — the cheapest option is the one you don't write.
  Name it explicitly even when you reject it. If a premise finding invalidates the
  spec's scope or constraints, flag it back as an open question — don't silently amend
  the spec; that's `/discuss`'s to revise, not yours.
- **Survey genuinely different options.** Two or three alternatives that differ in
  structure — not one approach with cosmetic variations — each tied to the code you read
  and to the spec's constraints. Research external libraries or approaches when they're
  worth comparing, but tie each back to how it fits here.
- **Match option weight to the goal.** A small spec doesn't need three architectural
  options. Don't manufacture alternatives to look thorough; if there's genuinely one
  sane approach, say so and record why the others don't apply.
- **Fan out when the space is wide.** For a large or unfamiliar surface, spawn parallel
  agents to research different options or libraries independently, then union their
  findings — one heads-down pass has blind spots. Give each spawned agent the spec path,
  the specific option or library to investigate, and the shape you want back
  (what-it-is / how-it-fits-here / pros-cons with `file:line`) — they inherit none of
  this conversation's context.

## Output

Write a durable options doc a fresh session (or `/grill`) can pick up cold. Reuse the
spec's full `YYYY-MM-DD-<slug>` prefix and name it `<prefix>-options.md`, so it sorts
adjacent to the spec even when researched on a later day. Save it beside the spec under
`.boris/plans/` at the repo root. Tell the user the exact path.

### Structure

1. **Spec** — cite the spec doc by path; don't restate it. Note the commit/branch the
   research was done against.
2. **Current state** — how the relevant code fits together today and where the feature
   hooks in, with `file:line` for anything load-bearing. Include what's *absent* if it
   shapes the options.
3. **Options** — two or three genuinely different approaches. Per option: what it is,
   how it works against §2, its dependency/complexity cost, and an explicit
   **Pros / Cons** list, judged against the spec's constraints. Include the
   question-the-premise (platform- or library-native) option, even if rejected.
4. **Recommendation** — the option you lean toward and why — a lean, not a decision —
   with one line on why each other option loses, so `/grill` doesn't reopen settled
   ground without reason.
5. **Open questions** — the decisions `/grill` must resolve before `/plan`.
6. **Next step** — this doc plus the spec feed `/grill` to harden the chosen approach.

## Before done: red-team the options

Your lean is where your bias hides. Run the producer gate from the `adversarial-review`
skill ("As a producer gate") on the doc, withholding the recommendation from the brief.
Aim the mandate at: an option dismissed too fast, the platform-native premise
under-examined, a recommendation that doesn't follow from the stated trade-offs, and
any `file:line` citation that doesn't hold. If a finding invalidates the lean,
re-survey rather than defending it.

## Rules

- **Ground every claim.** Re-check each cited `file:line` against the actual code before
  writing it — a confident wrong citation misleads everything downstream.
- **Don't decide, don't build.** No final approach pick, no plan, no code. A precise
  option survey narrows the space — that's the value, not license to choose.
- **Don't restate the spec.** Reference it by path; capture only what's new — the code
  grounding and the options.
- Reference other existing artifacts (issues, prior plans, commits) by path or URL too.
- Redact secrets and PII.
- Write it cold-readable — the file plus the spec must suffice; no "as we discussed."
- Be direct: if the spec looks wrong or the goal is ill-scoped, say so instead of
  surveying options for the wrong problem.

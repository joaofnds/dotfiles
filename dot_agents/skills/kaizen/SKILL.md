---
name: kaizen
disable-model-invocation: true
description: >
  End-of-session retrospective on the instruction artifacts actually exercised,
  skills, agents, rules, CLAUDE.md/AGENTS.md, where a fresh critic reads the
  transcript cold and proposes grounded improvement diffs. Invoke at the END of a
  session: "kaizen", "retro on this process", "how could this skill/agent/rule be
  better". Skip mid-task (no evidence yet). Skip when the improvement is grounded
  in an external subject: a repo, file, or published guidance to learn from →
  /absorb. Skip for consolidating the memory store itself → /dream. Improving
  the work product itself → /adversarial-review, or a user-invoked /code-review,
  not this.
---

# Kaizen: Retro on the Instructions You Used

**You are a neutral witness; a fresh critic is the judge.** The agent that ran the
session critiques a *remembered* version of the instruction and defends its own
choices (`engineering-judgment.md` §6: narrative-continuity-over-correctness), so
the biased party only observes; judgment is delegated.

## What counts as a target

The instruction artifacts *actually exercised* this session:

- **Skills invoked / agents spawned**: clear-cut; a skill merely available but unused is
  not a target.
- **CLAUDE.md / AGENTS.md**: include one only when concrete friction traces to it.
- **Rule files**: include only when the session actually routed or loaded them and
  concrete friction traces to them. Critiquing every standing rule is busywork.

Collect their real paths **in the chezmoi source tree**: `~/code/dotfiles/dot_agents/`
(`skills/*/SKILL.md`, `agents/*.md`, `rules/*.md`, `AGENTS.md`) plus project instruction
files. That tree is what the critic reads, quotes, and proposes against; the
`~/.agents`→`~/.claude` copies are rendered output, named only to report drift. No target
means nothing to reflect on; say so and stop.

## Assemble the evidence: the critic reads it, you don't pre-digest it

Two sources, in priority order:

1. **The raw session transcript: primary.** Probe the active runtime for its transcript
   path rather than assuming Claude Code's layout. In Claude Code the transcripts live in
   `${CLAUDE_CONFIG_DIR:-$HOME/.claude}/projects/<slug>/<session-id>.jsonl`, where `<slug>`
   is the cwd with `/`, `.`, spaces, and `~` all collapsed to `-`
   (`instruction-external-facts.md` §Harness mechanics). Don't derive the slug; `ls` that `projects/` dir and match an entry against
   the cwd, then pick `$CLAUDE_CODE_SESSION_ID.jsonl` (set in Claude Code
   sessions: `instruction-external-facts.md` §Harness mechanics). If the variable is empty, do not guess by mtime: a
   concurrent session in the same cwd writes a newer file. Confirm a candidate by grepping
   it for a distinctive string from this session's own first user message, and report
   "no transcript evidence" when nothing confirms.
   Pass an existing path to the critic. If no transcript source is available, ask for an
   export or stop with an explicit "no transcript evidence" result; memory alone is not
   a substitute.
2. **A friction-log index: supplementary.** A scratchpad list pointing the critic at
   the moments in the transcript worth its attention: redos, tool errors, dead ends,
   backtracks, points where an instruction was ambiguous, corrections the user had to
   make, redundant steps. State **events, not verdicts**: "re-ran the build 3× after
   the fmt step failed," not "step 3 was confusing." Be **inclusive**; filtering by "was
   this the skill's fault?" is where your bias leaks in. This is an *index into* the
   transcript, never a replacement; the transcript is what protects the critic from
   what you left out.

Collect the artifact **paths** (the skill/agent/rule files) for the critic to Read
itself. Do not paste or summarize their contents: a summary is where you'd smuggle in
your reading.

## Spawn the fresh critic

Spawn un-named; `~/.agents/rules/subagent-spawning.md` §The two shapes picks
foreground vs background.

One independent agent: `instructions-reviewer`. Send:

- The transcript path (primary) and the friction-log index (supplementary).
- The artifact paths plus `~/code/dotfiles/dot_agents/rules/continuous-improvement.md`
  (source tree, same as the artifacts).
- The session goal in the user's terms, so it can judge whether an instruction helped or
  hindered reaching it.
- The bar below, as *its* acceptance test for every finding that cites the session.

Withhold your own read on what should change, which parts you think worked, and any
leading framing. Say it in the brief: "This brief contains no assessment of the
instructions; form your own from the transcript and the files."

It also audits file quality holistically: accept its session-grounded findings under
the bar, and take file-quality findings it raises *outside* the transcript evidence at
their reported severities. In each reply line, say whether the finding carries
transcript evidence (`instructions-reviewer.md` §Inputs: edit both).

## The bar: 1-4 decide whether a finding is reported, 5 decides its form

1. **Grounded**: cites an actual moment in the transcript/index, not a hypothetical.
2. **Quoted**: reproduces the real instruction text it Read; no `file:line` from memory.
3. **Falsifiable**: states which observed moment the change would have prevented, and
   how it knows.
4. **Concrete diff**: proposed replacement text. Not "clarify step 3."
5. **Prose is the last mechanism**: names the strongest mechanism that could enforce the
   rule instead, ranked in `continuous-improvement.md` §3. Root Cause and PDCA. Where a
   check could carry it, the proposal is that check: name the file it lands in,
   `scripts/check-corpus-budgets.sh` or a sibling registered in `scripts/check-all.sh`,
   or a hook under `dot_claude/hooks/`, and the exact condition it would test.

Criteria 1-4 are the drop gate: a finding missing any of them is confabulation wearing a
suit; drop it. Criterion 5 drops nothing; it sets the proposal's form, so a finding whose
rule a check could carry is reported with that check named in place of the prose diff. A
file-quality finding citing no session moment is exempt from 1 and 3, and takes 2, 4, and
5 on the same terms. A clean session is a valid verdict: output "no change warranted"
only when no finding clears 1-4 (2 and 4 for a file-quality finding), with the
evidence that the artifacts held up. Manufacturing edits violates
`continuous-improvement.md` §1: omit reflection when no actionable improvement was found.

## Output: propose against the source of truth, don't apply

Write the critic's report verbatim to `/tmp/kaizen-<the session id resolved in §Assemble
the evidence>.md`, including findings that indict a skill you like. The reply carries no
report text beyond your one-line verdict, that path, and one line per finding, worst
first. Do not write the change; leave applying to the user.

Target the source tree the critic already read: a fix applied to the live `~/.agents` copy
is untracked and gets overwritten on the next `chezmoi apply`.

Your own response goes in a section of that file marked as yours, *after* the findings;
never pre-argue a finding away.

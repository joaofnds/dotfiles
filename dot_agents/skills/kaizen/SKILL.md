---
name: kaizen
description: >
  After a work session, run a retrospective on the instruction artifacts you actually
  exercised — the skills, agents, and rules/CLAUDE.md/AGENTS.md (personal or project)
  that guided the work — and extract trustworthy, grounded improvements to them. A fresh
  critic reads the session transcript and the real instruction files cold, so the
  feedback isn't the biased self-congratulation an agent produces when asked "what would
  you change?". Invoke at the END of a session: "kaizen", "reflect on the skills/agents
  we used", "how could this skill/agent/rule be better", "retro on this process", "what
  would you improve about the instructions". Skip mid-task (no evidence yet). Skip for
  improving the code or work product itself — that's /adversarial-review or /code-review.
  This improves the instructions that guided the work, not the output.
metadata:
  trigger: A session that exercised skills/agents/rules just finished; you want grounded, low-bias improvements to those instruction artifacts

# Kaizen — Retro on the Instructions You Used

**You are a neutral witness; a fresh critic is the judge.** The move you're tempted to
make — ask the agent that just ran the session "what would you change?" — is the least
trustworthy one available: it defends its own choices, wants to please you, and
critiques a *remembered* version of the instruction rather than its actual text
(`engineering_judgment.md` §8: narrative-continuity-over-correctness, fabricated
verification). So the biased party only observes; judgment is delegated.

## What counts as a target

The instruction artifacts *actually exercised* this session:

- **Skills invoked / agents spawned** — clear-cut; a skill merely available but unused is
  not a target.
- **Rules, CLAUDE.md, AGENTS.md** — these are always loaded, so include one *only* when
  the session surfaced concrete friction traceable to it, never by default. Critiquing
  every standing rule each session is the busywork this skill forbids.

Collect their real paths (`~/.agents/skills/*/SKILL.md`, `.claude/skills/*/SKILL.md`,
`.claude/agents/*.md`, `~/.agents/rules/*.md`, `~/.agents/AGENTS.md`, project
`CLAUDE.md`). No target → nothing to reflect on; say so and stop.

## Assemble the evidence — the critic reads it, you don't pre-digest it

Two sources, in priority order:

1. **The raw session transcript — primary.** Ground truth: the actual events, immune to
   your end-of-session recall decay and selective omission. Locate it concretely — it's
   `~/.claude/projects/<cwd, each "/" replaced by "-">/$CLAUDE_CODE_SESSION_ID.jsonl`
   (cwd `/Users/joaofnds/code/trunk` → `.../projects/-Users-joaofnds-code-trunk/$CLAUDE_CODE_SESSION_ID.jsonl`).
   Pass the path to the critic and have it read the transcript itself. If the file
   genuinely isn't there, say so — don't silently fall back to memory alone.
2. **A friction-log index — supplementary.** A scratchpad list pointing the critic at
   the moments in the transcript worth its attention: redos, tool errors, dead ends,
   backtracks, points where an instruction was ambiguous, corrections the user had to
   make, redundant steps. State **events, not verdicts** — "re-ran the build 3× after
   the fmt step failed," not "step 3 was confusing." Be **inclusive**; filtering by "was
   this the skill's fault?" is where your bias leaks in. This is an *index into* the
   transcript, never a replacement — the transcript is what protects the critic from
   what you left out.

Collect the artifact **paths** (the skill/agent/rule files) for the critic to Read
itself. Do not paste or summarize their contents — a summary is where you'd smuggle in
your reading.

## Spawn the fresh critic

One independent agent — `instructions-reviewer` if available (built for instruction
files), else a general agent carrying this brief. Send:

- The transcript path (primary) and the friction-log index (supplementary).
- The artifact paths, plus: "Read each file before making any claim about it."
- The session goal in the user's terms, so it can judge whether an instruction helped or
  hindered reaching it.
- The bar below, as *its* acceptance test for every finding it returns.

Withhold your own read on what should change, which parts you think worked, and any
leading framing. Say it in the brief: "This brief contains no assessment of the
instructions — form your own from the transcript and the files."

If the critic is `instructions-reviewer`, it also audits file quality holistically —
accept its session-grounded findings under the bar, and treat any strong file-quality
findings it raises *outside* the transcript evidence as a clearly-labeled bonus, not as
session-grounded.

## The bar — every finding the critic returns must clear all four

1. **Grounded** — cites an actual moment in the transcript/index, not a hypothetical.
2. **Quoted** — reproduces the real instruction text it Read; no `file:line` from memory.
3. **Falsifiable** — states which observed moment the change would have prevented, and
   how it knows.
4. **Concrete diff** — proposed replacement text with the five-point frame from
   `continuous_improvement.md` §3 (friction, root cause, fix, benefit, cost). Not
   "clarify step 3."

A finding missing any of these is confabulation wearing a suit — drop it. And a clean
session is a valid verdict: if nothing clears the bar, the output is "no change
warranted," with the evidence that the artifacts held up. Manufacturing edits to seem
useful is the exact failure this skill exists to prevent (`continuous_improvement.md`
§7, Busywork).

## Output: propose against the source of truth, don't apply

Relay the critic's findings in its own words, worst first — including any that indict a
skill you like. Present each as a **proposed diff**; do not write the change. Leave
applying to the user.

Target the **source of truth**: instructions are chezmoi-managed in
`~/code/dotfiles/dot_agents/` (`skills/`, `rules/`, `agents/`, `AGENTS.md`), not the
`~/.agents`→`~/.claude` symlinked copies — a fix applied to the live copy is untracked
and gets overwritten on the next `chezmoi apply`.

If you have a response, keep it in a separate section marked as yours, *after* the
findings — never pre-argue a finding away.

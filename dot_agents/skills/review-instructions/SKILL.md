---
name: review-instructions
description: Reviews instruction files written for agents: CLAUDE.md, AGENTS.md, skill bodies and descriptions, agent definitions. Use after writing or editing one, or when an instruction keeps failing to change the agent's behavior.
---

# Review instructions

An instruction file is a standing prompt: it spends context every time it loads and
competes with the task for attention. The common defect is the stale, redundant, or
over-prescriptive rule, not the missing one; review for what to cut before what to
add.

## Ground the review first

Claims about what the model already does rot with every release. Before judging a
rule redundant or necessary, re-check the current model guidance: the model-specific
pages under `platform.claude.com/docs/en/build-with-claude/prompt-engineering/`,
the skill-authoring page at
`platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices`, and the
CLAUDE.md guidance at `code.claude.com/docs/en/best-practices`. A model-behavior
claim not checked this session is labeled inference in the findings. A model
release also triggers a subtraction-only pass over the instruction files in
`~/code/dotfiles`: cut and merge verdicts only.

The same discipline covers the artifact: verify every path, symbol, tool name, and
flag it references before resting a finding on one; a false positive asserted from
memory is the review's worst failure. What you can't verify is labeled unverified,
with what would settle it.

## The checks

**Earn each line.** For every line: would the agent err without it? A line restating
defaults, standard conventions, or things readable from the code is cost without
effect, and a bloated file buries the rules that matter. Whether a line is a no-op
is a fact about the model, not the reader: settle a disagreement by running the
document, and delete a failing sentence whole rather than trimming its words.
Models self-verify, self-correct, and delegate unprompted; instructing what already
happens compounds with the default and only adds cost.

**Keep the house delta.** A line encoding a deliberate choice a capable model won't
make unprompted is incompressible, however strict it reads. What compresses is the
material around it: choreography, anticipated-failure sermons, persuasion aimed at
the author. Flag the sermon, never the rule.

**Don't cache the environment.** Scripts, flags, layout, and `--help` output are
lookups the agent can run; a line restating them is a copy that goes stale where
the original cannot. Keep only what no lookup reveals: the unwritten convention,
the reason behind a choice, the gotcha no config confesses.

**Prefer the brief steer to the enumeration.** One sentence stating the principle
outperforms a list naming each case; detail past the principle lowers output
quality, not just costs tokens. Where a list of cases shares one reason, propose
the reason as the rule.

**Read each rule literally, and write it so it can be.** The model reads literally.
Ask what the literal reading forbids or causes: "only report high-severity issues"
reads as an instruction to find less; "be conservative" suppresses real findings.
A rule written as imagery has no literal reading at all ("shortening is where
certainty sneaks in" names no action). The test
for any line is whether you would say it aloud to a colleague in those words; if
not, rewrite it in the words you would use, and if it has no plain restatement,
the line was decoration and the verdict is cut.

**Reason over command.** An ALL-CAPS ALWAYS or NEVER is a rule that couldn't explain
itself; reframe it with its why, and the model generalizes to the edge cases the
bare command would miss. Positive examples of the wanted behavior steer better than
prohibitions, because negation drags the forbidden thing into context and makes it
more available, not less; so a prohibition that must stay states the wanted behavior
beside it. Three to five diverse examples beat a description.

**Review each example as the behavior it teaches.** The agent copies an example's
register (cadence, sentence shape, length) more faithfully than it obeys any rule
about register, and the file's own prose carries the same way: decorated
instructions invite decorated answers. Decoration, concretely: a sentence whose
only job is to set up the next one, a headline in front of a fact, a metaphor
where a plain word says more, a number that proves effort instead of informing.
Compression is not decoration: a dense clause that carries a rule stays, and a
sentence is flattened only when the plain form loses nothing.
An example whose style contradicts the
rules defeats them. When a correct rule keeps failing, look for the failure
modeled in the file's examples or prose before rewriting the rule. Where register
is the rule, a quoted failure beside its corrected form steers better than a
description.

**Keep the evidence out of the rule.** An instruction states the rule and its
reason, in the present tense. Citations, evidence hedges, version notes, and
references to past wording dilute the lines that steer; the claim's history belongs
in the commit message and the evidence records. Flag it and name where it goes.

**Check the placement.** Always-loaded files carry only what applies broadly every
session; occasional knowledge belongs in a skill, loaded on demand. In a long file,
put critical rules early or restate them in a one-line reminder at the end; the
middle is where rules get dropped. A skill description is third person, says what
the skill does and when to use it, and is the sole trigger for loading: when
on-demand material goes unread, sharpen the trigger before inlining the material.
Keep a body under 500 lines, references one level deep, one term per concept, and
nothing time-sensitive.

**End steps on a checkable bound.** In workflow instructions, each step ends on a
condition the agent can test: "every modified file accounted for", not
"understanding reached"; a vague bound invites finishing before done, a demanding
bound drives the digging the step needs. A state-mutating rule names an object
bindable without judgment: a path, an enumerated set, a pattern plus a probe;
"stale entries" is a description by role.

**Prefer enforcement to prose.** A rule that a hook, a type, a template, or a CI
gate could enforce is a defect as prose: prose asks for vigilance, the guard
removes the possibility. Flag it and name the guard. Danger language on a
destructive path is not a mitigation; the remedy is a gate or a deny rule, never
stronger adjectives.

**State the complement.** A rule that enumerates part of a set leaves the rest's
status to inference, and inference is where behavior regresses silently across
model swaps. Where a rule names included and excluded sets, each item lands exactly
once: an item in neither silently loses force; an item in both is a contradiction.

**Detect conflicts.** Read the rule against everything else that loads with it:
the global file, the project file, sibling skills. Two rules that collide resolve
silently and unpredictably; surface the collision and propose which one owns the
case.

## The verdict

Open with the file's line count and the net delta of the change under review; a
file that only grows is itself a finding. An edit that only adds is incomplete: each addition
names what it displaces, or why nothing could go.

Each finding carries a verdict (cut, rewrite, move, enforce, or test in use) and
the reason. The default for a suspect rule is cut and watch, never
keep-just-in-case: restoring from git is free, so name the trigger for the re-check
(a model swap, a count of sessions) and delete now. "Test in use" is the verdict
for a rule whose effect prose review cannot establish: reading a file cannot show
that a rule changes behavior, only that it can't; the test is a real task in a
fresh session, and the review names it. Suggested rewrites land verbatim and seed
the next review: run the checks over the text you are about to prescribe.

A requested review ends as findings, nothing applied; a review of your own edit
inside directed work applies the verdicts and ends in the commit.

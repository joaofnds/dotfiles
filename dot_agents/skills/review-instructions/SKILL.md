---
name: review-instructions
description: >-
  Reviews and steers the drafting of instruction files written for agents,
  including CLAUDE.md, AGENTS.md, skill bodies and descriptions, agent definitions,
  and output styles. Use before drafting one, so the checks shape the writing, and
  after writing or editing one, to gate the result. An instruction failure observed
  as session behavior starts at kaizen, which uses these checks on the file it
  traces to.
---

# Review instructions

An instruction file is a standing prompt. It spends context every time it loads and
competes with the task for attention. The common defect is the stale, redundant, or
over-prescriptive rule. Review for what to cut before what to add.

## Before you write

Read this section before drafting a file, and again over every sentence you add
while applying verdicts.

Write the file in the register it should produce. One fact per sentence. A rule and
its reason, in the present tense, in the words you would say to a colleague. The
shapes to leave out: a sentence whose job is to set up the next one, a headline in
front of a fact, a pair balanced against its opposite where the second half adds
nothing ("not A but B" as a flourish; a precise contrast or a prohibition such as
"X, never Y" stays), a semicolon joining two clauses, a colon that names a thing and
then explains it (a colon stands only before a list or a quotation), an em dash, a
metaphor where the plain word says more, and a count that proves effort. The corpus
around the file is not the standard. Several corpus files still carry these shapes,
and a draft that matches them copies the defect.

Two pairs, the written form and the plain form, each keeping its rule and reason:

Written: "Close it as Done. Done, not archive, because the next run reads Done
titles."
Plain: "Close it as Done. The next run reads Done titles, and an archived card is
not among them."

Written: "A board with no milestone has no recorded goal. On such a board, skip
priorities, the queue, and the no-consequence closure."
Plain: "On a board with no milestone, skip priorities, the queue, and the
no-consequence closure, since each needs a goal to be judged against."

A semicolon between list items, a precise contrast, and a prohibition stay as
written. Softening a rule into a comparison ("rather than" for "not") is not
flattening, and reads as a preference where the rule forbade the case.

## Ground the review first

Claims about what the model already does rot with every release. Before judging a
rule redundant or necessary, re-check the current model guidance: the model-specific
pages under `platform.claude.com/docs/en/build-with-claude/prompt-engineering/`,
the skill-authoring page at
`platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices`, and the
CLAUDE.md guidance at `code.claude.com/docs/en/best-practices`. A model-behavior
claim not checked this session is labeled inference in the findings. A model
release also triggers a subtraction-only pass over the instruction files in
`~/code/dotfiles`, with cut and merge verdicts only.

The same discipline covers the artifact. Verify every path, symbol, tool name, and
flag it references before resting a finding on one. A false positive asserted from
memory is the review's worst failure. What you can't verify is labeled unverified,
with what would settle it.

## The checks

**Earn each line.** For every line, ask whether the agent would err without it. A
line restating defaults, standard conventions, or things readable from the code is
cost without effect, and a bloated file buries the rules that matter. Whether a
line is a no-op is a fact about the model. Settle a disagreement by running the
document, and delete a failing sentence whole rather than trimming its words.
Models self-verify, self-correct, and delegate unprompted. Instructing what already
happens compounds with the default and only adds cost.

**Keep the house delta.** A line encoding a deliberate choice a capable model won't
make unprompted is incompressible, however strict it reads. What compresses is the
material around it: choreography, anticipated-failure sermons, persuasion aimed at
the author. Flag the sermon and keep the rule.

**Don't cache the environment.** Scripts, flags, layout, and `--help` output are
lookups the agent can run. A line restating them is a copy that goes stale where
the original cannot. Keep only what no lookup reveals: the unwritten convention,
the reason behind a choice, the pitfall no config states.

**Prefer the brief steer to the enumeration.** One sentence stating the principle
outperforms a list naming each case. Detail past the principle lowers output
quality as well as costing tokens. Where a list of cases shares one reason, propose
the reason as the rule.

**Read each rule literally, and write it so it can be.** The model reads literally.
Ask what the literal reading forbids or causes. "Only report high-severity issues"
reads as an instruction to find less. "Be conservative" suppresses real findings.
A rule written as imagery has no literal reading at all ("shortening is where
certainty sneaks in" names no action). The test for any line is whether you would
say it aloud to a colleague in those words. If not, rewrite it in the words you
would use. If it has no plain restatement, the line was decoration and the verdict
is cut.

**Reason over command.** An ALL-CAPS ALWAYS or NEVER is a rule that couldn't explain
itself. Reframe it with its why, and the model generalizes to the edge cases the
bare command would miss. Positive examples of the wanted behavior steer better than
prohibitions, because negation puts the forbidden thing into context and makes it
more available. A prohibition that must stay states the wanted behavior beside it.
Three to five diverse examples beat a description.

**Read every sentence as the behavior and register it teaches.** The agent copies
an example's register (cadence, sentence shape, length) more faithfully than it
obeys any rule about register, and the file's own prose carries the same way.
Decorated instructions invite decorated answers. The shapes are listed under
"Before you write". Check every sentence of the file against them, examples and
rules alike, whether or not any rule has been seen to fail. A rule that offers the
colon as the em-dash substitute manufactures the pivot. Paragraph length shows
nothing, since a file rewritten into short paragraphs can keep every shape. A dense
clause that carries a rule stays. A sentence is flattened only when the plain form
loses nothing. An example whose style contradicts the rules defeats them. When a
correct rule keeps failing, look for the failure modeled in the file's examples or
prose before rewriting the rule. Where register is the rule, a quoted failure
beside its corrected form steers better than a description.

**Keep the evidence out of the rule.** An instruction states the rule and its
reason, in the present tense. Citations, evidence hedges, version notes, and
references to past wording dilute the lines that steer. The claim's history belongs
in the commit message and the evidence records. Flag it and name where it goes.

**Check the placement.** Always-loaded files carry only what applies broadly every
session. Occasional knowledge belongs in a skill, loaded on demand. In a long file,
put critical rules early or restate them in a one-line reminder at the end, because
the middle is where rules get dropped. A skill description is third person, says
what the skill does and when to use it, and is the sole trigger for loading. When
on-demand material goes unread, sharpen the trigger before inlining the material.
Keep a body under 500 lines, references one level deep, one term per concept, and
nothing time-sensitive.

**End steps on a checkable bound.** In workflow instructions, each step ends on a
condition the agent can test: "every modified file accounted for" rather than
"understanding reached". A vague bound invites finishing before done. A demanding
bound drives the digging the step needs. A state-mutating rule names an object
bindable without judgment: a path, an enumerated set, a pattern plus a probe.
"Stale entries" is a description by role.

**Prefer enforcement to prose.** A rule that a hook, a type, a template, a script,
or a CI gate could enforce is a defect as prose, because the guard removes a
possibility that prose only asks the reader to avoid. Flag it and name the guard.
Danger language on a destructive path is not a mitigation. The remedy is a gate or a
deny rule, never stronger adjectives. A guard enforces the rule itself. Where only a
proxy could be enforced, the rule stays prose. A numeric proxy for a judgment rule
replaces the principle with a count, obeyed or breached exactly where judgment was
needed, and it forces cuts when more is genuinely needed. A rule only judgment can
check gets "test in use". Its counts belong in the evidence records. A rule with a mechanical part and a judgment part gets a script for the first and
prose for the second.

**State the complement.** A rule that enumerates part of a set leaves the rest's
status to inference, and inference is where behavior regresses silently across
model swaps. Where a rule names included and excluded sets, each item lands exactly
once. An item in neither silently loses force. An item in both is a contradiction.

**Detect conflicts.** Read the rule against everything else that loads with it:
the global file, the project file, sibling skills. Two rules that collide resolve
silently and unpredictably. Surface the collision and propose which one owns the
case.

## The verdict

Open with the file's line count and the net delta of the change under review. A
file that only grows is itself a finding. An edit that only adds is incomplete
until each addition names what it displaces, or why nothing could go. An edit that
claims to change only form gets the inverse audit. Set old beside new and account
for every sentence of the old text, either carried with its rule, reason, scope,
and force intact, or its loss named. Reformatting loses meaning silently.

Each finding carries a verdict (cut, rewrite, move, enforce, or test in use) and the
reason. The default for a suspect rule is cut and watch, never keep-just-in-case.
Restoring from git is free, so name the trigger for the re-check (a model swap, a
count of sessions) and delete now. "Test in use" is the verdict for a rule whose
effect prose review cannot establish. Reading a file can show that a rule cannot
change behavior, and cannot show that it does. The test is a real task in a fresh
session, and the review names it. Suggested rewrites land verbatim and are checked
by the next review, so run the checks over the text you are about to prescribe.

A requested review ends as findings, nothing applied. A review of your own edit
inside directed work applies the verdicts and ends in the commit. A file you wrote
or rewrote in this session takes one pass by a reviewer that had no part in it,
handed this file as its axes, before its commit or its handoff to João. The pass
does not rerun after the repairs. An edit smaller than a paragraph gets the section above, without the pass.

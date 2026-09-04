---
name: review-instructions
description: >-
  Reviews and steers the drafting of instruction files written for agents,
  including CLAUDE.md, AGENTS.md, skill bodies and descriptions, agent definitions,
  and output styles. Use before drafting one, so the checks shape the writing, and
  after writing or editing one, to gate the result. An instruction failure observed
  as session behavior goes to João as a kaizen candidate, and kaizen uses these
  checks on the file it traces to.
---

# Review instructions

Review for what to cut before what to add. An instruction file spends context every
time it loads and competes with the task for attention, and the common defect is the
stale, redundant, or over-prescriptive rule.

Apply these checks to a file that loads into a model's context to govern how it
works: `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`, rules, skills, slash commands, agent
definitions, output styles, the reference files those route into, and hooks that
inject instruction text. Apply them to instruction text a plan embeds for later
landing, as if it were already in its destination file. Do not apply them to a
document an agent consumes as task input, however imperative it reads. Three carriers
load and are still exempt: memory files, fixtures under `evals/`, whose defects are
planted, and `workflows.md`, which is gated by form.

Check the text under review, not the file around it. Bringing an existing file up to
these checks is its own task, never a side effect of an unrelated edit.

## Before you write

Read this section before drafting a file, and again over every sentence you add
while applying verdicts.

Write the file in the register it should produce. One fact per sentence. State a
rule and its reason, in the present tense, in the words you would say to a
colleague. Prefer an imperative addressed to the reader over a statement about how
things are.

Leave out these shapes: a sentence whose job is to set up the next one, a headline
in front of a fact, a pair balanced against its opposite where the second half adds
nothing ("not A but B" as a flourish; a precise contrast or a prohibition such as
"X, never Y" stays), a semicolon joining two clauses, a colon that names a thing and
then explains it (a colon stands only before a list or a quotation), an em dash, an
en dash used as an aside, a metaphor where the plain word says more, and a count
that proves effort.

Do not take the corpus around the file as the standard. Several corpus files still
carry these shapes, and a draft that matches them copies the defect.

Two pairs, the written form and the plain form:

Written: "Never apply this probe to temporal coupling; judge that on whether the
ordering or interleaving assumption can be violated."
Plain: "Never apply this probe to temporal coupling. Judge that on whether the
ordering or interleaving assumption can be violated."

Written: "A board with no milestone has no recorded goal. On such a board, skip
priorities, the queue, and the no-consequence closure."
Plain: "On a board with no milestone, skip priorities, the queue, and the
no-consequence closure, since each needs a goal to be judged against."

A semicolon between list items, a precise contrast, and a prohibition stay as
written. Softening a rule into a comparison ("rather than" for "not") is not
flattening, and reads as a preference where the rule forbade the case.

Prefer the fix that is a deletion or a shorter rewording. A new rule deletes the rule
it supersedes, in the same edit. Where an edit grows a file, the commit message names
the action the new lines change and what they replaced, or says they replaced nothing.

## Ground the review first

Re-check the current model guidance before judging a rule redundant or necessary,
because claims about what the model already does rot with every release. Read the
model-specific pages under
`platform.claude.com/docs/en/build-with-claude/prompt-engineering/`, the
skill-authoring page at
`platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices`, and the
CLAUDE.md guidance at `code.claude.com/docs/en/best-practices`. Label a
model-behavior claim you did not check this session as inference. Where the vendor's
pages conflict on emphasis, follow the dial-back side, which João ratified, and do
not relitigate it from the older pages.

Read what this machine's harness and tools were observed to do in
[references/external-facts.md](references/external-facts.md), each entry with the
check that verified it and the trigger that re-verifies it. Query the `prompts` wiki
with `qmd` for claims from papers and vendor documentation. A numeric or outcome
claim that neither backs is unaudited. Treat it as a mechanism argument and never
cite it as measured. Without vault access, mark a source claim unverified rather than unaudited,
since unverified names what would settle it.

Require a rule to be complete in place, so the reader complies using only the text in
front of them, never leaning on an unopened file for its justification. Two exceptions: material the reader must open to act, a checklist or a
catalog, and a claim about outside facts, which names the probed entry or the wiki
page where its evidence lives.

Cite by heading, never by section number, since headings move and nothing updates the
pointer. Carry the heading's own words, and name a bolded rule label the same way.

Run a subtraction-only pass over the instruction files in `~/code/dotfiles` on each
model release, with cut and merge verdicts only.

Verify every path, symbol, tool name, and flag before resting a finding on one,
because a false positive asserted from memory is the review's worst failure. Label
what you cannot verify unverified, with what would settle it. Name the case you
probed and never generalize from it, since a probe of one case settles that case
alone. Where an instruction tells a session to run a command, run it in a throwaway
copy first.

## The checks

**Earn each line.** Ask of every line whether the agent would err without it. Cut a
line restating defaults, standard conventions, or what is readable from the code,
because a bloated file buries the rules that matter. Models self-verify,
self-correct, and delegate unprompted, so instructing what already happens only
adds cost. Settle a disagreement about whether a line is a no-op by running the document, since
it is a fact about the model rather than a matter of argument. Delete a failing sentence whole, never trimming its words.

**Keep the house delta.** Keep a line encoding a deliberate choice a capable model
will not make unprompted, however strict it reads. Keep the rule and cut what
surrounds it: choreography, anticipated-failure sermons, persuasion aimed at the
author.

**Don't cache the environment.** Cut a line restating scripts, flags, layout, or
`--help` output, because the copy goes stale where the original cannot. Keep what no
lookup reveals: the unwritten convention, the reason behind a choice, the pitfall no
config states.

**Prefer the brief steer to the enumeration.** Replace a list of cases with the
reason its cases share, because detail past the principle lowers output quality as
well as costing tokens.

**Read each rule literally, and write it so it can be.** Ask what the literal
reading forbids or causes, because the model reads literally. "Only report
high-severity issues" reads as an instruction to find less. "Be conservative"
suppresses real findings. Ask whether you would say the line aloud to a colleague in
those words, and rewrite it in the words you would use. A rule written as imagery has
no literal reading at all ("shortening is where certainty sneaks in" names no
action). Cut a line with no plain restatement, since it was decoration.

**Reason over command.** Reframe an ALL-CAPS ALWAYS or NEVER with its why, and the
model generalizes to the edge cases the bare command would miss. Prefer a positive
example of the wanted behavior to a prohibition, because negation puts the forbidden
thing into context and makes it more available. Where a prohibition must stay, state
the wanted behavior beside it. Three to five diverse examples beat a description.

**Read every sentence as the behavior and register it teaches.** Check every
sentence against the shapes under "Before you write", examples and rules alike,
whether or not any rule has been seen to fail. The agent copies an example's
cadence, sentence shape, and length more faithfully than it obeys any rule about
register, and the file's own prose carries the same way. Keep a dense clause that
carries a rule. Flatten a sentence only where the plain form loses nothing. Where a
correct rule keeps failing, look for the failure modeled in the file's own examples
or prose before rewriting the rule. Flag a rule that offers the colon as the em-dash
substitute, since it manufactures the pivot. Where register is the rule, quote the
failure beside its corrected form rather than describing it. Paragraph length shows nothing, since a file rewritten
into short paragraphs can keep every shape.

**Keep the evidence out of the rule.** Move citations, evidence hedges, version
notes, and references to past wording out of the file, because they dilute the lines
that steer. The claim's history belongs in the commit message and the evidence
records. Keep a re-check trigger, naming what to re-check, the event that fires it,
and the state it was last checked against.

**Check the placement.** Keep in an always-loaded file only what applies broadly
every session, and move occasional knowledge to a skill. Put critical rules early in
a long file, or restate them in one line at the end, because the middle is where
rules get dropped. Write a skill description in third person, saying what the skill
does and when to use it, since it is the sole trigger for loading. Where on-demand
material goes unread, sharpen the trigger before inlining it. Keep a body under 500
lines, references one level deep, one term per concept, and nothing time-sensitive.

**End steps on a checkable bound.** Require each workflow step to end on a condition
the agent can test, since a vague bound invites finishing before done and a demanding
bound drives the digging the step needs. Prefer "every
modified file accounted for" to "understanding reached". Require a state-mutating
rule to name an object bindable without judgment: a path, an enumerated set, or a
pattern plus a probe. "Stale entries" is a description by role.

**Prefer enforcement to prose.** Name the guard where a hook, a type, a template, a
script, or a CI gate could enforce a rule, because the guard removes a possibility
that prose only asks the reader to avoid. On a destructive path, require a gate or a
deny rule, never stronger adjectives. A guard enforces the rule itself. Leave the
rule as prose where only a proxy could be enforced, because a numeric proxy for a
judgment rule replaces the principle with a count, obeyed or breached exactly where
judgment was needed. Its counts belong in the evidence records. Split a rule
with a mechanical part and a judgment part: a script for the first, prose for the
second. Give a rule only judgment can check the verdict "test in use".

**State the complement.** Leave no part of a set to inference, because inference is
where behavior regresses silently across model swaps. Where a rule enumerates part
of a set, require it to state the rest's status. Where a rule names included and
excluded sets, require every item to land in exactly one, because an item in neither
silently loses force and an item in both is a contradiction.

**Change an action.** Require a rule to name what the agent does differently, and
when: an action, an artifact, an omission, an evidence requirement, or a boundary. A
prohibition qualifies, naming the action not to take. Cut a rule asking only for
awareness or care, since it changes nothing, and record that incident in git history
instead.

**Name the consumer.** Require a rule mandating an action to name what sees the
evidence it happened: an artifact a later step reads, a hook that fires on it,
another rule keyed to it, or a line the rule requires in the reply. Ask whether a run
that skipped the action is distinguishable from one that took it, because the agent's
word that it complied is not evidence. Where nothing distinguishes them, carry the
rule in the strongest mechanism that fits, or cut it.

**One home.** Require a rule to appear once, in the file its audience loads, and cut
restatements. Keep one copy per co-loaded path, because a copy on a path the router
never combines is that path's only copy and cutting it removes the rule from that
phase. A skill description read without opening the body, a sub-agent prompt, and
hook-injected text are the common cases. Mark each copy with the path and heading of
the others.

**Detect conflicts.** Read the rule against everything else that loads with it, the
global file, the project file, and sibling skills. Surface a collision and say which
rule owns the case, because two rules that collide resolve silently and
unpredictably.

## Known failure modes

Name the mode when a finding matches one.

- **Context rot**: recall degrades as prompt size grows.
- **Lost-in-the-middle**: rules buried mid-prompt receive less attention.
- **Instruction saturation**: too many simultaneous rules reduce compliance.
- **Instruction-hierarchy collision**: lower-priority text conflicts with
  higher-priority instructions.
- **Conflict-silent compliance**: conflicting rules resolve without surfacing the
  conflict.
- **Dispatch ambiguity**: invocation and skip conditions do not identify one route.
- **Over-triggering**: aggressive trigger language invokes a skill outside its scope.
- **Judgment displacement**: a rule pins a context-dependent call to a constant
  ("always 3 retries", "cap files at 200 lines"), and the model complies faithfully
  where context makes the constant wrong.
- **Assumed shared context**: guidance vague enough to presume project knowledge the
  model lacks. The gap fills silently with plausible defaults rather than a question.
- **Pink-elephant negation**: a negative names the prohibited behavior with no
  positive replacement.
- **Caller-context leakage**: a fresh sub-agent is assumed to know caller state.
- **Premature completion**: a step lacks a checkable completion gate.
- **Borrowed authority**: another agent's assertion is consumed as verified evidence.
- **Linter laundering**: deterministic checks spend prompt budget instead of tooling.
- **No-op / self-reference**: a rule imposes no action, artifact, omission, evidence
  requirement, or boundary.
- **Instruction laundering**: the same rule appears under several headings that load
  together. The One home check settles which case it is.
- **Decay**: a path, version, tool, or mechanism has gone stale.

## The verdict

Open with the file's line count and the net delta. Report a file that only grows as
a finding in itself. Require each addition to name what it displaces, or why nothing
could go.

Audit an edit that claims to change only form. Set old beside new and account for
every sentence of the old text, carried with its rule, reason, scope, and force
intact, or its loss named, because reformatting loses meaning silently. Count a
rule's prohibition as part of its force, so name the loss where a description
survives without its "never". Audit a file merged into another and deleted the same
way, against the deleted text git still holds.

Re-read every line that survives the cut and say it more simply, in shorter words,
one fact per sentence, in the shape you would use aloud. Give a line that keeps its
rule and loses a metaphor, a colon pivot, or a hard word the verdict rewrite, not
keep. Keep the clause that says why a rule exists, because the model generalizes
from it to cases the bare command misses.

Give each finding a verdict, one of cut, rewrite, move, enforce, or test in use, and
the reason. Default to cut and watch, never keep-just-in-case. Name the trigger for
the re-check, a model swap or a count of sessions, and delete now, since restoring
from git is free. Give "test in use" to a rule whose effect prose review cannot
establish, and name the test, a real task in a fresh session. Reading a file can show
that a rule cannot change behavior, and cannot show that it does. Run the checks over
any text you prescribe, because a suggested rewrite lands verbatim.

End a requested review as findings and apply nothing. Reviewing your own edit inside
directed work, apply the verdicts and end in the commit.

Send a file you wrote or rewrote this session to a reviewer that had no part in it,
once, before the commit or the handoff to João. Give that reviewer this file, the
diff, and João's words if there are any, and never your own description of the
change. Do not run the review again after the fixes. Read the fixes yourself in the
staged diff, with the same checks, because the reviewer did not see them. Skip the
review for an edit smaller than a paragraph and apply the section above instead.

---
name: deslop
description: Removes the writing patterns that mark prose as machine-written, from documents, commit bodies, comments, and essays, using inventories of the phrases and the structures to cut. Use before delivering prose others will read. Standing instruction files are out of scope, and the brief output style governs replies.
---

# Deslop

Prose written by a model carries patterns a reader recognizes. They survive rereading
because they read as fluent. Two inventories hold them.
[references/phrases.md](references/phrases.md) covers the patterns that live in a
word or a phrase, and [references/structures.md](references/structures.md) covers the
ones that live in a sentence's shape or a paragraph's rhythm.
[references/examples.md](references/examples.md) shows the pairs. Each file's own
headings are the full set, so open it rather than working from a summary.

## What this covers

A document read once and acted on is in scope: a shaped task, a diagnosis, a handoff,
a README, a design record, a commit body, a comment.

A file that loads as standing instructions is not: AGENTS.md and CLAUDE.md, a skill and
everything under it, an agent definition, an output style, a rules file, a memory note,
or any other file an agent reads as instructions rather than as work. The
review-instructions skill governs those, and its register rules differ. Clean one only
where João names that file and asks.

## The pass

Run the fast checks below before delivering prose. Open an inventory when a check
fires and you need the exact pattern, and walk both when the whole document needs the
pass.

- An adverb carrying no degree, timing, frequency, or uncertainty goes.
- An opener that announces the point instead of making it goes.
- An emphasis crutch goes, where the causal or qualifying content survives without it.
- Business jargon becomes the plain word.
- The passive voice names its actor, where the actor matters and is known.
- An inanimate subject doing a human verb names the person, where responsibility is
  the point, and stays where it is a precise technical term with no actor to name.
- "Not X, it's Y" becomes Y, unless the distinction is load-bearing.
- Negative listing becomes the positive statement.
- A rhetorical setup becomes the point it was circling.
- A vague declarative names the specific thing.
- An extreme word ("every", "always", "never") doing vague work names the real scope.
- Sentences clipped or stacked for rhythm become whole sentences.
- A third list item padding a pair goes, unless the three are a complete set.
- An em dash becomes a comma or a full stop.
- Softening that reassures the reader goes. State the fact.

## What not to break

The passage asserts something, and the pass preserves it. Where a check calls for a
specific the text does not supply, leave the sentence and name it for the author.
Never invent a fact, an actor, a scope, or an implication to satisfy a check.

In text you did not draft, confine each edit to the sentence that carries the pattern,
or to the span for a rhythm pattern, and prefer the smallest edit that kills it. Prose
that passes stays as written. Your own draft has no original to protect, though
inventing to satisfy a check is barred there the same as anywhere.

Before polishing a comment, apply the test in `~/.agents/rules/coding-style.md`
§Comments default to zero, whether the code gets misread or silently broken without
it. A comment that survives the pass and fails that test is deleted rather than
rewritten.

In a commit message, clean the body and leave the subject alone, since its format is
the project's convention.

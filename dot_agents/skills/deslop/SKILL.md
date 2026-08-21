---
name: deslop
description: Remove AI writing patterns from prose: essays, docs, plans, commit-message bodies, code comments. Skip standing instruction files; these slop checks never apply to them, however their prose reads.
---

# Deslop

Eliminate predictable AI writing patterns from prose. The pattern inventories are
[references/phrases.md](references/phrases.md), throat-clearing openers, emphasis
crutches, empty adverbs, vague declaratives, and
[references/structures.md](references/structures.md): binary contrasts, negative listing,
dramatic fragmentation, rhetorical setups, false agency.

## Scope

Skip text that persists into an agent's context as standing instructions: AGENTS.md,
CLAUDE.md, GEMINI.md, rules files, memory files, slash commands, skills (the whole
package: `SKILL.md` and its `references/`, not just the top file), agent definitions, or
anything loaded the same way. Don't clean these: their prose stays as written, whatever
else does or doesn't separately check it; that's accepted, not a gap to route around.
Clean one only if the user names that specific file and asks for it.

Task-scoped documents an agent reads once, plans, handoff briefs, research notes,
READMEs, PRDs, are in scope. They're prose, not standing instructions.

## Checks

This is the fast gate; run it before delivering prose. For a full pass, open both
[references/phrases.md](references/phrases.md) and
[references/structures.md](references/structures.md) and walk every category; each
holds categories this list doesn't spell out. When a single check fires and you need
the exact pattern, open just the file that holds it.

- Adverb that adds no degree, timing, frequency, or uncertainty? Kill it.
- Throat-clearing opener ("here's what", "it's worth noting")? Cut to the point.
- Emphasis crutch ("full stop", "let that sink in", "this matters because")? Delete it only when the causal or qualifying content survives the cut.
- Business jargon ("navigate", "unpack", "deep dive", "circle back")? Replace with plain language.
- Passive voice hiding a relevant actor? Name the actor and lead with them; keep it when the actor is unknown, irrelevant, or meant to stay unnamed.
- Inanimate thing doing a human verb ("the decision emerges") where responsibility matters? Name the person; keep the phrase if it's a precise technical metaphor with no actor to name.
- Wh- sentence openers repeating as a mannerism? Restructure one.
- "Not X, it's Y" where the distinction adds nothing? State Y directly; keep it when the distinction is logically necessary.
- Negative listing ("Not a X... Not a Y... A Z.")? State Z directly; the reader doesn't need the runway.
- Rhetorical setup ("What if...", "Think about it:")? Make the point directly.
- Vague declarative ("The implications are significant")? Name the specific implication.
- Lazy extreme ("every", "always", "never") doing vague work? Name the actual scope.
- Narrator-from-a-distance ("Nobody designed this")? Put the reader in the scene; "you" beats "people".
- Dramatic fragmentation: sentences clipped or stacked for effect ("X. And Y. And Z."; "This unlocks something. Finally.")? Write complete sentences.
- Third item padding out a list of three? Cut it; keep all three when the list is a complete taxonomy.
- Every paragraph ending on a punchy one-liner? Vary some.
- Em-dashes repeated and carrying no clause the sentence needs? Swap them for commas or periods.
- Softening or hand-holding ("and that's okay", "not always, not perfectly")? Cut it. State the fact and trust the reader.
- Meta-joiner ("The rest of this essay...")? Delete. Let the essay move.

## Guardrails

- Preserve what the passage asserts. Never invent a fact, actor, scope, or implication to
  satisfy a check: when a check calls for a specific the text doesn't supply, leave the
  sentence and name it for the author instead of guessing. Applies to your own drafts too.
- **Text you did not draft:** confine each edit to the sentence, or, for rhythm and
  repetition patterns, the span, that exhibits the pattern, and prefer the smallest edit
  that kills it. Prose that passes the Checks stays as written. On your own draft there's
  no original to preserve; rewrite freely.
- Comment you're about to polish? Run `coding-style.md`'s test first: "will this code
  be misread or silently broken without it?" A comment that survives slop cleanup but
  fails that test gets deleted, not rewritten.
- Commit message? Clean the body only. Leave the subject line alone; its format is a
  project-specific convention these Checks don't touch. This applies even to a commit
  message you're drafting yourself.

## Examples

See [references/examples.md](references/examples.md) for before/after transformations.

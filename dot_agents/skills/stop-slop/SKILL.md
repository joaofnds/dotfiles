---
name: stop-slop
description: Review public-facing prose for formulaic AI writing patterns without changing technical meaning. Skip source code and precision-first technical artifacts unless the user explicitly asks for a prose pass.
metadata:
  trigger: Writing prose, editing drafts, reviewing content for AI patterns
  author: Hardik Pandya (https://hvpandya.com)
---

# Stop Slop

Remove formulaic AI writing patterns from public-facing prose. Technical accuracy,
logical qualification, project terminology, and the author's voice outrank every pattern
below. Treat patterns as review signals, not bans.

## Core Rules

1. **Cut filler phrases.** Remove throat-clearing openers and emphasis crutches. Keep adverbs that carry necessary degree, timing, or uncertainty. See [references/phrases.md](references/phrases.md).

2. **Break formulaic structures.** Rewrite repeated binary contrasts, negative listings, dramatic fragments, rhetorical setups, and false agency when they are mannerisms rather than the clearest logic. See [references/structures.md](references/structures.md).

3. **Prefer active voice.** Use passive voice when the actor is unknown, irrelevant, or deliberately de-emphasized. Do not force a human subject into technical statements.

4. **Be specific.** No vague declaratives ("The reasons are structural"). Name the specific thing. No lazy extremes ("every," "always," "never") doing vague work.

5. **Put the reader in the room.** No narrator-from-a-distance voice. "You" beats "People." Specifics beat abstractions.

6. **Vary rhythm.** Mix sentence lengths and structures. Do not change a complete three-part list or a useful em dash merely to satisfy a pattern check.

7. **Trust readers.** State facts directly. Skip softening, justification, hand-holding.

8. **Cut quotables.** If it sounds like a pull-quote, rewrite it.

## Quick Checks

Before delivering prose:

- Any empty adverbs? Cut them.
- Any avoidable passive voice? Name the actor.
- Does false agency hide relevant responsibility? Name the actor; otherwise keep precise technical metaphors.
- Repeated sentence openings? Vary them.
- Any "here's what/this/that" throat-clearing? Cut to the point.
- Repeated "not X, but Y" contrasts? Keep only those that express real logic.
- Three consecutive sentences match length? Break one.
- Paragraph ends with punchy one-liner? Vary it.
- Repeated em dashes used as rhythm crutches? Replace them.
- Vague declarative ("The implications are significant")? Name the specific implication.
- Narrator-from-a-distance ("Nobody designed this")? Put the reader in the scene.
- Meta-joiners ("The rest of this essay...")? Delete. Let the essay move.

## Scoring

Rate 1-10 on each dimension:

| Dimension | Question |
|-----------|----------|
| Directness | Statements or announcements? |
| Rhythm | Varied or metronomic? |
| Trust | Respects reader intelligence? |
| Authenticity | Sounds human? |
| Density | Anything cuttable? |

Below 35/50: revise.

## Examples

See [references/examples.md](references/examples.md) for before/after transformations.

## License

MIT

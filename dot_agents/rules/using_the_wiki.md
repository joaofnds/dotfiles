# Using the Personal Wiki

The personal wiki (qmd collection `wiki`) is João's curated, LLM-maintained knowledge base — the reasoned substrate behind the engineering judgment principles. Case studies, book lineage, the Deming / Ohno / Spear / Farley / Fowler tradition, synthesis across hundreds of sources. Query it to ground design decisions in specific, cited knowledge rather than generic best-practice bromide.

## When to query

Consider querying the wiki for a material design decision when background or lineage
could change the outcome, especially on these topics:

- Delivery & process — continuous delivery, continuous integration, deployment pipelines, trunk-based development, DevOps culture, CALMS, DORA/Accelerate metrics, small batches
- Architecture — domain-driven design, event sourcing, CQRS, event-driven architecture, microservices, coupling, software architecture
- Testing & discipline — TDD, pair programming, code review, programmer's oath, software engineering discipline
- Systems & flow — systems thinking, product development flow, theory of constraints, golden signals, t1/t2 signals, visual management
- Lineage — Deming, Toyota Production System, Taiichi Ohno, Steve Spear, Gene Kim, Dave Farley, Martin Fowler, Uncle Bob, Greg Young, John Willis, Adam Hawkins
- Concepts — the five ideals, the ideal, high-velocity edge, poka-yoke, muda/mura/muri, kaizen, PDCA, understanding variation, red beads experiment, system of profound knowledge, percent complete and accurate

Also query when the user cites a topic in passing ("like Deming says..."), when composing a design doc or RFC, or when evaluating someone else's approach against foundational principles.

## How to query

```
qmd query "<topic or question>" -c wiki
```

Defaults to 5 results; `-n 10` for more, `--full` for whole documents instead of snippets.

Variants:
- `qmd search "<exact term>" -c wiki` — when you know the phrase, and to resolve a `(See: some-slug)` citation to its path. The slugs those citations use are kebab-cased titles, not paths: `anemic-domain-model` → `pages/Anemic-Domain-Model.md`. Some citations name a book instead (`(See: DDIA / Kleppmann)`) and have no filename to derive — use `qmd query` and pick the page from the results. A citation names a topic; it does not promise a path.
- `qmd get pages/<Title-Case-Name>.md` — the whole page, once you have the path
- `qmd ls wiki` — the file listing, optionally scoped (`qmd ls wiki/raw`). `qmd collection list` prints collection names and a file count, not files.

Cite the returned pages in your reasoning. Follow wikilinks into `raw/` when you need the primary source (podcast transcripts, talks, articles that the wiki page distills).

## When to skip

- Quick bug fixes, syntax-level work, mechanical refactors
- Topics clearly outside the wiki's scope (will return weak / hallucinated relevance)
- Any unavailable or failed `qmd` invocation is a soft failure. Report it briefly and continue without the wiki.

The wiki is optional enrichment, not a required gate. Repository evidence and the user's
stated preferences and requirements remain authoritative.

## What not to do

- Don't paste wiki content wholesale into responses — cite page titles and summarize in your own words
- Don't modify the wiki during a task that isn't explicitly about the wiki. If wiki content needs updating, flag it as a follow-up rather than doing it inline.

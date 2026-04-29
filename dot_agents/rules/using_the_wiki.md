# Using the Personal Wiki

The personal wiki at `Wiki/pages/` (qmd collection `wiki`) is João's curated, LLM-maintained knowledge base — the reasoned substrate behind the engineering judgment principles. Case studies, book lineage, the Deming / Ohno / Spear / Farley / Fowler tradition, synthesis across hundreds of sources. Query it to ground design decisions in specific, cited knowledge rather than generic best-practice bromide.

## When to query

Before designing a solution on a topic the wiki covers:

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

Hybrid BM25 + vector retrieval with LLM reranking. Defaults to 5 results; add `-n 10` for more, `--full` for whole documents instead of snippets.

Variants:
- `qmd search "<exact term>" -c wiki` — when you know the phrase
- `qmd get Wiki/pages/<page>.md` — when you know the page
- `qmd multi-get "Wiki/pages/*.md" -c wiki` — when you want to survey

Cite the returned pages in your reasoning. Follow wikilinks into `Wiki/raw/` when you need the primary source (podcast transcripts, talks, articles that the wiki page distills).

## When to skip

- Quick bug fixes, syntax-level work, mechanical refactors
- Topics clearly outside the wiki's scope (will return weak / hallucinated relevance)
- Environments without qmd installed — soft-fail, don't block the task

The wiki is optional enrichment, not a required gate.

## What not to do

- Don't paste wiki content wholesale into responses — cite page titles and summarize in your own words
- Don't treat a wiki page as more authoritative than the user's stated preference or the codebase's actual conventions
- Don't modify the wiki during unrelated tasks; wiki maintenance is its own workflow (see the vault's `CLAUDE.md`)
- Don't query for every decision — reserve it for design-level choices where lineage and reasoning matter

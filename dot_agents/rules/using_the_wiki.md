# Using the Personal Wikis

Two curated, LLM-maintained knowledge bases, indexed as two separate `qmd` collections:

| Collection | Vault | Subject |
|---|---|---|
| `wiki` | `~/code/wiki` | Engineering: design, delivery, systems, the Deming / Ohno / Spear / Farley / Fowler lineage |
| `prompts` | `~/code/prompt-wiki` | Prompt and context engineering: how to instruct LLMs and agents |

Query them to ground decisions in specific, cited knowledge rather than generic
best-practice bromide.

**Always pass `-c`.** A bare `qmd query` searches every collection regardless of working
directory, so it can answer from the wrong subject. `qmd update` is the exception — it
re-indexes all collections and takes no `-c`.

## Collection `wiki` — engineering

Query it for a material design decision when background or lineage could change the
outcome: delivery and process (continuous delivery, trunk-based development, DORA, small
batches), architecture (DDD, event sourcing, CQRS, microservices, coupling), testing
discipline, systems and flow (theory of constraints, golden signals, product development
flow), the lineage authors (Deming, Ohno, Spear, Kim, Farley, Fowler), and their
concepts (five ideals, poka-yoke, kaizen, PDCA, muda/mura/muri). Also query when the
user cites a topic in passing, when composing a design doc, or when evaluating an
approach against foundational principles.

This collection is optional enrichment, never a required gate. Repository evidence and
the user's stated requirements stay authoritative.

## Collection `prompts` — prompt engineering

Scope: prompt structure, context engineering, persistent instruction artifacts,
reasoning and output constraints, underspecification, eval design, documented failure
modes.

**Query it before writing or revising any instruction-artifact claim that rests on a
paper, a benchmark, or vendor documentation.** Enter through the corpus bridge page —
`qmd query "what this corpus licenses for instruction authoring" -c prompts` — which
carries the licensed and not-licensed lists across papers. Then, for the specific claim:

- **Quote the page's `## Evidence` fields, not its prose.** A `type: paper` page: quote
  `Measured` and `Does not license`. A `type: source` page whose `Claim type` is
  `mechanism` reported no measurement — it supports a mechanism argument and never an
  outcome claim. `Does not license` catches the recurring defect: a real finding about
  one referent restated about a different referent that shares a word.
- **A page with `provenance: secondhand` is not citable.** Nobody has read the primary
  text: refetch and flip the field first, or leave the claim out. `claim-status:
  rejected` pages are kept on purpose — read them before reviving a claim.
- **Fails closed on outage.** If `qmd` is unavailable, do not land the claim: drop it,
  or land it marked `(unverified — vault unreachable YYYY-MM-DD)` and say so.
- **No page is not an outage.** A reachable vault with no page for the source means:
  read the primary text, record what it established in `instruction_external_facts.md`,
  and note the vault page owed. A stale page loses only the contradicted field to a live
  primary read; record the supersession there and name the refresh owed.

**The checkable artifact is the citation, not the query.** Every such claim you land
names its `instruction_external_facts.md` entry, and that entry names the wiki page it
came from. A cited claim naming no entry is the defect, whether or not you ran the
query. `instruction_external_facts.md` stays self-contained (the instructions-reviewer
has no vault access); where it and a page disagree, the page's Evidence block wins and
the entry is re-derived from it.

## How to query

```
qmd query "<topic or question>" -c wiki      # engineering
qmd query "<topic or question>" -c prompts   # prompt engineering
```

Defaults to 5 results; `-n 10` for more, `--full` for whole documents.

- `qmd search "<exact term>" -c <collection>` — when you know the phrase, and to resolve
  a `(See: some-slug)` citation: those slugs are kebab-cased titles, not paths. A
  citation naming a book (`(See: DDIA / Kleppmann)`) has no derivable filename — query
  the author and pick the page from the results.
- `qmd get "qmd://<collection>/pages/<Name>.md"` — the whole page. Pass the full URI: a
  bare path fuzzy-matches and can silently return a different page — check the returned
  header names the page you asked for.
- `qmd ls <collection>` — the file listing, optionally scoped (`qmd ls wiki/raw`).

## When to skip

Quick bug fixes, syntax-level work, mechanical refactors, and topics outside both
scopes. A failed `qmd` invocation is a soft failure for the `wiki` collection — report
it briefly and continue. The `prompts` gate is the exception: it fails closed, per its
own clause above. Neither collection obliges you to find evidence for a claim that
rests on nothing external.

## What not to do

- Don't paste wiki content wholesale — cite page titles and summarize.
- Don't modify either wiki during a task that isn't about it; flag needed updates as a
  follow-up.
- Don't cite across subjects: an engineering-lineage claim does not belong in a
  prompt-engineering argument, and vice versa.

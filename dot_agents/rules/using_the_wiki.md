# Using the Personal Wikis

Two curated, LLM-maintained knowledge bases, indexed as two separate `qmd` collections:

| Collection | Vault | Subject |
|---|---|---|
| `wiki` | `~/code/wiki` | Engineering: design, delivery, systems, the Deming / Ohno / Spear / Farley / Fowler lineage |
| `prompts` | `~/code/prompt-wiki` | Prompt and context engineering: how to instruct LLMs and agents |

Query them to ground decisions in specific, cited knowledge rather than generic
best-practice bromide.

**Always pass `-c`.** A bare `qmd query` searches *every* collection, and the working
directory does not scope it: run from inside `~/code/wiki` with no flag and the top hits
come back `qmd://prompts/…` (verified 2026-07-30). Before there were two collections a
bare query resolved to the engineering wiki by accident, so older bare invocations are now
silently wrong rather than merely loose. `qmd update` is the exception — it re-indexes all
collections and takes no `-c`. `qmd embed -c <name>` does take one. *(This fact is mirrored
in both vault `CLAUDE.md` files and `review_checklist.md` §Sources — a change in qmd's
scoping behavior updates all four.)*

## Collection `wiki` — engineering

Query it for a material design decision when background or lineage could change the
outcome, especially on these topics:

- Delivery & process — continuous delivery, continuous integration, deployment pipelines, trunk-based development, DevOps culture, CALMS, DORA/Accelerate metrics, small batches
- Architecture — domain-driven design, event sourcing, CQRS, event-driven architecture, microservices, coupling, software architecture
- Testing & discipline — TDD, pair programming, code review, programmer's oath, software engineering discipline
- Systems & flow — systems thinking, product development flow, theory of constraints, golden signals, t1/t2 signals, visual management
- Lineage — Deming, Toyota Production System, Taiichi Ohno, Steve Spear, Gene Kim, Dave Farley, Martin Fowler, Uncle Bob, Greg Young, John Willis, Adam Hawkins
- Concepts — the five ideals, the ideal, high-velocity edge, poka-yoke, muda/mura/muri, kaizen, PDCA, understanding variation, red beads experiment, system of profound knowledge, percent complete and accurate

Also query when the user cites a topic in passing ("like Deming says..."), when composing
a design doc or RFC, or when evaluating someone else's approach against foundational
principles.

## Collection `prompts` — prompt engineering

Scope: prompt structure and phrasing, context engineering, persistent instruction
artifacts, chain-of-thought and reasoning, output constraints and structured generation,
underspecification and requirement elicitation, eval design, documented failure modes.

**Query it before writing or revising any rule, skill, agent definition, `AGENTS.md`, or
`CLAUDE.md` claim that rests on a paper, a benchmark, or vendor documentation.** Not
optional enrichment: a rule written from paper *summaries* shipped and was reverted the same
day (`instruction_external_facts.md` §4, recorded 2026-07-27).

Vendor and practitioner sources live in `raw/` alongside the papers, and their notes carry a
`fetched:` date in the header because the URLs serve mutable content. That date is what
`instruction_external_facts.md` §1's per-release re-verify trigger reads — so a vendor claim
queries here *and* settles there, rather than one or the other.

Enter through the corpus bridge page —
`qmd query "what this corpus licenses for instruction authoring" -c prompts` — which
carries the licensed *and* the not-licensed lists across papers. A single paper page gives
you only that paper's caveats; the class of error that produced the reverted rule lives in
the cross-paper negative list. Then, for the specific claim:

- **Quote the page's `## Evidence` fields, not its prose.** Two block shapes, and which one
  you get decides what the page can support:
  - `type: paper` — `Measured`, `Models & dates`, `Task domain`, `Does not license`,
    `Contested by`, `Provenance`. Quote `Measured` and `Does not license`.
  - `type: source` — vendor docs, conventions, practitioner guides, talks. `Claim type`,
    `Authority`, `Volatility`, `Does not license`, `Contested by`, `Provenance`. **A page
    whose `Claim type` is `mechanism` reported no measurement, so it supports a mechanism
    argument and never an outcome claim.** `Authority` says where the source's standing runs
    out; `Volatility` says what invalidates the page and when to re-verify — a vendor doc
    moves per release, and the frontmatter `retrieved:` date is what makes that checkable.

  `Does not license` is mandatory in both blocks. The recurring defect it catches is a real
  finding about one referent restated about a different referent that shares a word —
  constraining *output format* becomes constraining *reasoning*, concise *traces* become
  concise *prose*.
- **A page with `provenance: secondhand` is not citable in an instruction artifact.** It
  means nobody has read the primary text. Refetch and flip the field first, or leave the
  claim out. `claim-status: rejected` pages are kept on purpose — read them before
  reviving a claim.
- **Fails closed on outage.** If `qmd` is unavailable, do not land the claim: drop it, or
  land it marked `(unverified — vault unreachable YYYY-MM-DD)` and say so in the reply. The
  soft-failure licence in §When to skip does not extend to this gate, and "out of scope" is
  not available as a judgement — a claim resting on a paper is in scope by definition.
- **No page is not an outage.** A reachable vault with no page for the source is the
  fetch-primary case: read the primary text, record what it established in
  `instruction_external_facts.md` yourself, and open a vault-gap note there naming the pages
  owed. Do not mark the claim `unverified` — that label is for an unread source.
- **A stale page is not an outage either.** When the page exists but a live primary read
  contradicts it, the read wins for that field only: record the supersession in the
  `instruction_external_facts.md` entry, name the refresh the page is owed, and leave the
  rest of the page authoritative. The page-wins rule below resumes for that field once the
  refresh lands.

**The checkable artifact is the citation, not the query.** Every paper, benchmark, or
vendor-documentation claim
you land in an instruction artifact names its `instruction_external_facts.md` §3 entry, and
that entry names the wiki page it came from. A source §4 rejected but still permits for one
narrow use names its **§4** entry instead — §3 is for audited sources, and moving a rejected one
into §3 to satisfy this rule is the failure it guards against. The branch and anchor form are `AGENTS.md`
§Task lifecycle's, restated in §1's own rule paragraph and the preamble above it. A cited claim naming no entry is the
defect, whether or not you ran the query — which is what makes this gate reviewable by an
agent with only Grep.

`instruction_external_facts.md` stays self-contained (the instructions-reviewer has no
vault access): it owns the operative one-paragraph summary and the verification date; the
wiki page owns the full Evidence block, and each §3 entry names its page title so the
vault's Lint 2(c) can check the pair both ways. **When the two disagree, the page's Evidence
block wins and the entry is re-derived from it** — the page is where the primary text was
read.

*(The Evidence-block spec above mirrors `~/code/prompt-wiki/CLAUDE.md` §Evidence
conventions — edit both.)*

## How to query

```
qmd query "<topic or question>" -c wiki      # engineering
qmd query "<topic or question>" -c prompts   # prompt engineering
```

Defaults to 5 results; `-n 10` for more, `--full` for whole documents instead of snippets.

Variants, in both collections:

- `qmd search "<exact term>" -c <collection>` — when you know the phrase, and to resolve a `(See: some-slug)` citation to its path. The slugs those citations use are kebab-cased titles, not paths: `anemic-domain-model` → `pages/Anemic-Domain-Model.md`. Some citations name a book instead (`(See: DDIA / Kleppmann)`) and have no filename to derive — use `qmd query "<book or author>" -c <collection>` and pick the page from the results. A citation names a topic; it does not promise a path.
- `qmd get "qmd://<collection>/pages/<Name>.md"` — the whole page, once you have the path. Pass the full URI: a bare path fuzzy-matches, returning a *different* page with no error and plausible-looking content, and with two collections it can now return a page from the wrong subject entirely. Check that the header of what comes back names the page you asked for.
- `qmd ls <collection>` — the file listing, optionally scoped (`qmd ls wiki/raw`). `qmd collection list` prints collection names and a file count, not files.

Cite the returned pages in your reasoning. Follow wikilinks into `raw/` when you need the
primary source.

## When to skip

- Quick bug fixes, syntax-level work, mechanical refactors
- Topics clearly outside both wikis' scope (the scope table above decides this)
- Any unavailable or failed `qmd` invocation is a soft failure. Report it briefly and continue without the wiki.

For `wiki`, this is optional enrichment, not a required gate. Repository evidence and the
user's stated preferences and requirements remain authoritative. **The skip list above does
not apply to the `prompts` gate** — see its fail-closed clause. It places no obligation to
go find evidence for a claim that doesn't rest on any.

## What not to do

- Don't paste wiki content wholesale into responses — cite page titles and summarize in your own words
- Don't modify either wiki during a task that isn't explicitly about it. If wiki content needs updating, flag it as a follow-up rather than doing it inline.
- Don't cite across subjects. An engineering-lineage claim does not belong in a prompt-engineering argument, and vice versa; the two vaults cannot wikilink to each other for the same reason.

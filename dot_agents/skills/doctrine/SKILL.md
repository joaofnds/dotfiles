---
name: doctrine
description: João's full engineering doctrine. Method, testing, lean foundations, delivery, architecture, DDD, code craft, data systems, operations, and the rulings for when practices conflict. Read when designing, reviewing, or choosing between practices. Read sections 8 and 9 when the task touches data stores, queues, distributed state, or a running service.
---

The doctrine is `principles.md` in this directory: fourteen numbered sections, each
standing alone, each with a bold lead that carries its commitment. Read the section
you need rather than the whole file.

- §0 standing directives · §1 method · §2 TDD and testing · §3 lean foundations ·
  §4 delivery
- §5 architecture · §6 domain-driven design · §7 code craft
- §8 data and distributed systems · §9 operations and reliability. These bind when the
  task touches them and are context otherwise.
- §10 teams · §11 AI-assisted development · §12 conflict rulings · §13 scale
  translation · §14 lineage

The text is addressed to João: "your" there means his. Every line names, in
parentheses, the page of his wiki (`~/code/wiki`) it comes from. When a line reads
ambiguous, that page is the authority.

Two references sit beside it, in this directory:

- [references/engineering-judgment.md](references/engineering-judgment.md), how a
  problem is understood, a solution designed, and work evaluated, with the
  agent-specific failure modes. Read it when you design or judge an approach.
- [references/coupling.md](references/coupling.md), the vocabulary for naming coupling
  and deciding which to accept. Read it when a design draws or moves a module or
  service boundary.
- [references/wikis.md](references/wikis.md), how to query João's two curated wikis,
  the engineering one this doctrine is drawn from and the prompt-engineering one.
  Read it when a rule's background matters or a cited page needs following.

The summary in AGENTS.md, your always-loaded instructions, is a compression of this
file. Where the two seem to differ, this file wins.

# External Facts Behind the Instruction Review Checklist

Every fact `instructions-reviewer.md` takes from outside this repo, with its verification
date and what the source actually established. The reviewer has no documentation or web
access, so re-verification is the author's job. Cite a fact from here **with its date**.

## 1. Harness mechanics — verified 2026-07-25

Covers the numeric limits and field semantics in §1–§2 of the checklist: load limits,
import depth, listing caps, tool-field behavior, and what reaches a sub-agent.

Checked against the Claude Code sub-agents, skills, and memory references, plus the
Anthropic prompting-best-practices pages.

**Re-verify trigger:** each Claude Code or model release.
**Settling step for a disputed one:** re-check the sub-agents / skills / memory reference.

A **Blocker** resting on any of these is reported as
`Blocker [unverified — harness fact dated 2026-07-25]`.

Provenance note: a 2026-07-25 pass found the reviewer had been asserting six such
mechanics with none verified, and four were wrong. That is why these carry dates at all.

## 2. Deprecated model mechanics — date unknown, carried forward

Moved here 2026-07-27 from the inline §7 bullet, where it arrived undated. Treat the whole
list as due for re-verification on the next release.

- **Prefilled last-assistant-turn responses** — 400 on Claude 4.6+. Migrate to direct
  instruction, XML output tags, or Structured Outputs.
- **`budget_tokens` thinking caps** — 400 on Opus 4.7+ / Fable / Mythos. Use `effort`, or
  `max_tokens` as a hard ceiling.
- **Rules telling the model not to think or reason** — with thinking disabled this
  increases internal-XML-tag leakage into visible output. The general form ("do not
  include internal or system XML tags in your response") outperforms naming the tags.

This set grows.

## 3. Cited sources, and what each measured

The checklist's rule: name what a source measured before resting a claim on it. A source
that measured nothing supports a **mechanism argument**, never an **outcome claim**.

| Source | Cited at | What it is | What it supports |
|---|---|---|---|
| mattpocock, *Writing Great Skills* | §1 keep-side test, §2 invocation mode | Practitioner guide. No measurement. | Mechanism argument only. |
| Anthropic prompting-best-practices pages | §1–§2 limits, §4 XML tags | Vendor documentation. Normative, not a study. | Mechanism argument; re-check per release. |
| agents.md community convention | §9 project-root expectations | A convention. Nothing measured. | A default section list, not evidence. |

## 4. Rejected citations — do not restore

Recorded 2026-07-27 after a §6 rule ("a schema, vocabulary, or language restriction on the
reasoning step costs accuracy") was written from a spec's paper summaries, shipped, and
reverted the same day. The rule had zero true positives in this corpus and one costly
false positive: it flagged the `Decision:` block in `AGENTS.md`, a pre-commitment gate
whose entire function is to land before the work.

- **arXiv 2408.02442, *Let Me Speak Freely?*** — tested gpt-3.5-turbo, claude-3-haiku,
  gemini-1.5-flash, LLaMA-3-8B, Gemma-2-9B. All 2024, none reasoning models, none with a
  separate thinking channel. Found JSON-mode *helps* on classification tasks. Contested by
  dottxt's matched-prompt re-run, which found structured generation beat unstructured.
  The one clause that holds: performance recovers when unconstrained reasoning precedes
  the constrained output.
- **arXiv 2510.09555, multilingual CoT** — high-resource languages stay relatively stable
  under enforced target-language reasoning. Its collapse case is Yoruba, a competence
  effect, not premature serialization. It argues *against* constraining reasoning language
  in English.
- **Barez et al. 2025, *CoT Is Not Explainability*** (aigi.ox.ac.uk, not on arXiv) — an
  interpretability position paper. Its 25% figure is the share of surveyed papers misusing
  CoT, not an unfaithfulness rate. Its own recommendation is to corroborate CoT, not to
  discard it. Contested by arXiv 2512.23032.
- **arXiv 2505.19716, *Concise Reasoning, Big Gains*** — a CoT-distillation paper. Makes
  no correct-vs-incorrect length claim. The length finding belongs to **arXiv 2504.05185,
  *Concise Reasoning via RL***, where the mechanism is a PPO/GRPO training artifact and so
  licenses no claim about prose style.

Verification status: 2505.19716 and 2504.05185 were fetched from arXiv directly on
2026-07-27. The other four entries come from an adversarial reviewer's report with
quotations, and were not independently re-fetched.

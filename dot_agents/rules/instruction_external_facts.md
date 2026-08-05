# External Facts Behind the Instruction Review Checklist

Every external fact an instruction artifact cites **and this file has audited**, with its
verification date and what the source actually established. A numeric or outcome claim in any instruction
artifact that is not listed here is unaudited — treat it as a mechanism argument and never
cite it as measured. The reviewer has no documentation or web
access, so re-verification is the author's job. Cite a fact from here **with its date**.

1. Harness mechanics — numeric limits and field semantics, dated
2. Deprecated model mechanics
3. Cited sources, and what each measured — measured nothing / measured something
4. Rejected citations — do not restore

## 1. Harness mechanics — verified 2026-08-03

Covers the numeric limits and field semantics in §1–§2 and §8 of the checklist: load
limits, import depth, listing caps, tool-field behavior, and what reaches a sub-agent.
A checklist claim resting on Claude Code harness documentation cites **this section with
its date**; §3 records the sources behind it (page *Claude Code Instruction-Artifact
Mechanics*). A harness mechanic this section carries is cited as §1 with its date wherever
the claim lands; one it does not carry gets its own §3 entry (`AGENTS.md` §Task lifecycle
states the same rule).

First verified 2026-07-25; re-verified 2026-08-03 against the live memory, skills,
sub-agents, and settings references at code.claude.com/docs (all four vault raw notes
carry `fetched: 2026-08-03`; page *Claude Code Instruction-Artifact Mechanics*).
Every fact the checklist cites held, with one qualification: `CLAUDE.md`/`AGENTS.md`
reach every subagent *except* the built-in Explore and Plan agents, which skip them —
the checklist's §1 Loading-path bullet now carries it. The *Anthropic Prompting Best
Practices* page was last checked 2026-07-25; *Claude Code Instruction-Artifact Mechanics*
was re-fetched 2026-08-03 (§3 carries both dates).

**Re-verify trigger:** each Claude Code or model release.
**Settling step for a disputed one:** re-check the sub-agents / skills / memory reference.

**Standing numerics (re-verified 2026-08-03, page *Claude Code Instruction-Artifact
Mechanics*; these five are mirrored in `agents/instructions-reviewer.md` §1–§2, the
skill-listing entry as its 1,536 cap only — edit both or neither):**

- `MEMORY.md`: first 200 lines or 25KB, whichever comes first; content past the cap is
  silently dropped on the next load.
- Skill listing: 1,536 characters per entry (`description` + `when_to_use`, configurable);
  the listing overall gets 1% of the context window.
- `@path` imports in `CLAUDE.md`: maximum depth 4.
- `CLAUDE.md` is delivered as a user message after the system prompt and loads in full at
  any length; the 200-line target is a recommendation, not a cap.
- `CLAUDE.md`/`AGENTS.md` reach every subagent except the built-in Explore and Plan.

A **Blocker** resting on any of these is reported in the reviewer's form
(`agents/instructions-reviewer.md`, `Blocker [unverified — dated YYYY-MM-DD]`) with this
section's date filled in: `Blocker [unverified — dated 2026-08-03]`.

Provenance note: a 2026-07-25 pass found the reviewer had been asserting six such
mechanics with none verified, and four were wrong. That is why these carry dates at all.

### 2026-08-03 re-verification — corrections and additions

The Claude 5 release fired the re-verify trigger; the pass above closed it. Beyond
confirming the standing facts, this pass produced two corrections (`skillOverrides`
scope, memory load order), one withdrawal (`#` quick-add), and carries forward the
workflow-subagent fact from the same-day workflows fetch:

- **`skillOverrides` does not apply to plugin skills** — those are managed through
  `/plugin` (settings reference, field gated v2.1.129+). The checklist had stated the
  override unconditionally; its Inputs paragraph and §1 now carry the exemption.
- **`#` quick-add is no longer documented.** The memory reference now documents
  auto-memory instead: on by default (`autoMemoryEnabled`), per-project directory
  `~/.claude/projects/<project>/memory/`, machine-local, not loaded into subagents
  except forks. §8 of the checklist dropped the `#` mention.
- Memory load order is managed policy → user → project → local; project files in
  subdirectories load on demand by directory. (§8 previously said "enterprise →
  project → user → local".)
- Workflow-spawned subagents always run in `acceptEdits` mode and inherit the session's
  tool allowlist regardless of the session's permission mode; file edits are auto-approved
  (workflows reference, feature gated v2.1.154+). Carried by §2's least-privilege bullet.

## 2. Deprecated model mechanics — date unknown, carried forward

Moved here 2026-07-27 from the inline "Deprecated model mechanics" rule, where it arrived undated. Treat the whole
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

Cite any source below **with its page's `retrieved:` date**, except where the page also
backs a §1 harness mechanic — then cite §1 with §1's date. The vault's Lint 2(b) sweeps
those dates because "the current release" is not observable from inside the vault.

**Measured nothing.** All three now have `type: source` pages in the `prompts` vault,
`provenance: primary`, each carrying `Claim type: mechanism` — which is where the
never-an-outcome-claim rule below is now recorded formally, per source.

- mattpocock's *Writing Great Skills* ("Deletions have a keep-side test," "Invocation mode
  sets what the description is for") is a practitioner guide. Page: *Writing Great Skills
  (Pocock)* (retrieved 2026-07-30). Pinned to a commit, so it moves only when the pin does.
- The Anthropic prompting-best-practices pages (size and dispatch limits, "XML tags as
  delimiters") are vendor documentation, so re-check them per release. Pages: *Anthropic
  Prompting Best Practices* (retrieved 2026-07-25) and *Claude Code Instruction-Artifact
  Mechanics* (retrieved 2026-08-03).
- The agents.md convention ("AGENTS.md / CLAUDE.md specifics") is a convention, and carries
  adoption only. Page: *AGENTS.md as a Cross-Agent Convention* (retrieved 2026-07-30).

All three support a **mechanism argument**, never an **outcome claim**.

**The Claude-5 set — added 2026-08-03, all `type: source`, `provenance: primary`,
`Claim type: mechanism`, `retrieved: 2026-08-03`.** These back the checklist's
Claude-5-era checks (judgment displacement, examples-vs-interfaces, cross-carrier tool
guidance, reference over restatement, the embedded-verification probe) and the two
failure modes added to `instruction_failure_modes.md` the same day. Mechanism arguments
only; none reports a methodology.

- Anthropic's *The New Rules of Context Engineering for Claude 5 Generation Models*
  (blog, 2026-07-24). Page: *The New Rules of Context Engineering (Anthropic 2026)*.
  Six "then vs now" reversals. Its one number — over 80% of Claude Code's system prompt
  removed for Opus 5 / Fable 5 "with no measurable loss on our coding evaluations" —
  names no eval, method, or per-rule breakdown: it licenses "old-model guardrails whose
  content the model now gets right by judgment are removable", never "cut your corpus".
  The post itself exempts house-specific opinion ("except in highly important areas").
  Three reversals are stated outright and are the load-bearing ones here: tool-usage
  examples "actually constrain [models] to a certain exploration space" — design
  expressive interfaces instead (backs §3 *Examples*); "put instructions on how to use
  tools in the tool descriptions rather than the system prompt", deleting the repeats
  (backs §4 *Tool guidance duplicated across carriers*); and rich references — "prefer
  files that are in code", "a HTML mockup of a design will generally produce better
  results than a description of the design or a screenshot" (backs §3 *Reference over
  restatement*).
- Anthropic's *A Field Guide to Claude Fable 5* (blog, 2026-07-06). Page: *A Field Guide
  to Claude Fable 5 (Anthropic 2026)*. Carries the judgment-displacement mechanism
  sentence: too specific → faithful compliance even when a pivot would be right; too
  vague → generic industry defaults that may not fit. Single-author practitioner
  experience, zero measurement; stated about prompts, extended to persistent artifacts
  by argument only. Also states the reference preference from the prompt side: "the
  absolute best reference is *source code*", richer than a screenshot (seconds §3
  *Reference over restatement*).
- Anthropic's *Effective Context Engineering for AI Agents* (engineering post,
  2025-09-29). Page: *Effective Context Engineering for AI Agents (Anthropic 2025)*.
  Backs "right altitude" (brittle hardcoded logic and vague shared-context assumptions
  as twin defects), "minimal does not mean short", canonical-examples-over-edge-case
  lists, and the decay clause ("smarter models require less prescriptive engineering").
  Its context-rot numbers belong to Chroma's research, not this post.
- Anthropic's *Building Verification Loops in Claude Code with Skills* (blog,
  2026-07-22). Page: *Building Verification Loops in Claude Code with Skills (Anthropic
  2026)*. Backs the embedded-verification fired-probe check ("invoke the skill on a
  fresh task and confirm the new step runs"). Never mentions hooks.
- Anthropic's *Dynamic Workflows in Claude Code* (blog 2026-06-02 plus the workflows
  docs reference, both fetched 2026-08-03). Page: *Dynamic Workflows in Claude Code
  (Anthropic 2026)*. Source of §1's workflow-subagent `acceptEdits` fact; the docs page
  supersedes the blog where they disagree (resume semantics), and is version-annotated
  v2.1.154–v2.1.219 — the most volatile source in the vault.

**Measured something — added 2026-07-30, backing "Complement stated?".** All three
primary full texts were fetched and read 2026-07-30 and now have pages in the `prompts`
vault; each entry below names its page. Only the first is load-bearing for that rule; the
second earns its place as an honesty guard (it records a null result) and the third names
the mechanism. These license a claim about *underspecification's cost*; none tests the
remedy the rule prescribes, so read the split in each entry before resting a finding on it.
**Where an entry and its page disagree, the page wins** — re-derive the entry from the page,
not the reverse.

- **arXiv 2505.13360, *What Prompts Don't Say*.** Page: *What Prompts Don't Say (Yang et al.
  2025)*. Llama-3.3-70B-Instruct, gpt-4o (05-13 / 08-06 / 11-20), o3-mini, Llama-3,
  Llama-3.1, Llama-3.3; Commitpackft, an UltraChat travel subset, and Amazon ESCI, 200
  examples each, against 60 curated requirements. A requirement omitted from the prompt was
  inferred to >98% accuracy in **41.1%** of cases; omission cost **22.6%** accuracy on
  average, up to 93.1%. Across six model versions, unspecified requirements took a >20%
  accuracy drop at **5.9%**, which the paper calls "almost 2x" the specified rate (the ~3%
  specified figure is derived from that ratio, not printed). Its own remedy, two automated
  requirement-aware prompt optimizers, gained **4.8%** on average.
  **The fourth result, and the one that bears on "Complement stated?":** requirements followed at **98.7%**
  accuracy when specified individually fell to **85.0%** (gpt-4o) and **79.7%**
  (Llama-3.3-70B) when 19 were specified together, with 37.5% of requirements dropping >5%
  including pairs with no apparent conflict. *Licenses:* leaving a requirement to inference is
  unreliable and decays across model swaps — the durability argument; and adherence is a
  budget, so each added requirement taxes the others. *Does not license:* that prose stating a
  complement improves compliance. The paper inserted requirements mechanically and never
  tested authored scope statements, so the remedy is untested *in this form*; the +4.8% is
  weak positive evidence for specifying a requirement at all.
- **arXiv 2607.02294, *Coding Agents Are Guessing* (UnderSpecBench).** Page: *Coding Agents
  Are Guessing (Ji et al. 2026)*. Five agent×model configurations over OpenCode, Claude Code,
  and Codex — claude-haiku-4.5, Codex-5.1-mini, DeepSeek-v4, all small/fast tier, no frontier
  model; 69 task families, 2,208 prompt variants, autonomous mode with confirmation disabled.
  **55.8–67.8% of *acted* runs** violated at least one boundary — **quote the denominator**:
  over all scored runs the Overstep rate is **27.0–46.3%**, because many runs never act. (The
  paper's abstract states the range without the qualifier; its introduction supplies it.)
  Under target underspecification, acted-run Safe Success fell **67.9% → 8.6%** while Wrong
  Target rose **9.6% → 75.1%**. *The nearest tested intervention was null:* moving an
  operation to a shared or production surface left Action Rate at **65.5% vs 64.0%** and
  refusals at 0.5% vs 1.0%, so agents do not self-restrain on stated consequence severity. It
  does **not** test an explicit out-of-scope declaration, which is the intervention our rule
  prescribes — so that remains untested rather than refuted.
- **arXiv 2607.01953, *Underspecification does not imply Incoherence*.** Page: *Semantic
  Collapse (Richter and Papadakis 2026)*. Settling step **completed 2026-07-30** — full text
  read, models and ranges recorded, this entry re-derived from the page. Claude Sonnet 4.5,
  GPT-4.1-mini, Qwen3-32B; MBPP+, HumanEval+, LiveCodeBench, temperature 0.8, Python only.
  Detrimental collapse affects **10–16% of MBPP**, **over 3% of HumanEval**, and **18–32% of
  LiveCodeBench** on the *original* benchmark prompts — ranges, not point values — rising by a
  factor of **1.45× to 5.53×** on MBPP when underspecification is injected deliberately. Names
  the mechanism the rule assumes: models "collapse onto a single incorrect interpretation …
  coherent but behaviorally misaligned" instead of surfacing the ambiguity — a *gap* resolved
  silently, which is adjacent to but not the same as "Cross-file contradictions," and is
  not the analogue of the checklist's self-contradiction Blocker. *Also licenses one
  asymmetry worth quoting exactly:* inconsistency when present is a real signal of model
  uncertainty; its absence is **not** evidence of correctness.

## 4. Rejected citations — do not restore

Recorded 2026-07-27 after a rule ("a schema, vocabulary, or language restriction on the
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
  discard it. Contested by arXiv 2512.23032. **Still cited in the Operating notes, only for
  what it is *not*** (a transcript measurement) — that use stands as a mechanism argument.
  Do not restore the 25% figure or any unfaithfulness rate.
- **arXiv 2505.19716, *Concise Reasoning, Big Gains*** — a CoT-distillation paper. Makes
  no correct-vs-incorrect length claim. The length finding belongs to **arXiv 2504.05185,
  *Concise Reasoning via RL***, where the mechanism is a PPO/GRPO training artifact and so
  licenses no claim about prose style.

Verification status, updated 2026-07-30: **the seven sources named in this section are
covered by six primary-source pages in the `prompts` vault** — *Let Me Speak Freely (Tam et al.
2024)*, *Multilingual Chain-of-Thought Evaluation (Zhao et al. 2025)*, *CoT Is Not
Explainability (Barez et al. 2025)*, *Is CoT Really Not Explainability (Zaman and Srivastava
2025)*, *Concise Reasoning Big Gains (Wu et al. 2025)*, *Concise Reasoning via Reinforcement
Learning (Fatemi et al. 2025)*. The four entries that previously rested on an adversarial
reviewer's quotations no longer do. Re-derive from the page, not from this summary. Two
corrections the full texts produced: the first author of 2505.19716 is Yifan **Wu** (not Xu),
and Barez et al. is a **position paper** whose only original measurement is the 244/1,000
paper survey.

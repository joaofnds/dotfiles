# External Facts Behind Instruction Artifacts

The audited evidence store for claims instruction artifacts make about outside
sources: the harness, vendor documentation, papers. A numeric or outcome claim in an
instruction artifact that is not listed here is unaudited: treat it as a mechanism
argument and never cite it as measured. Cite an entry as `instruction_external_facts.md` §<heading>. The instructions-reviewer has no web or vault access, so
re-verification is the author's job; git history holds when each entry changed and the
full narrative of past passes.

## Harness mechanics

Read from the live memory, skills, sub-agents, settings, hooks, and workflows
references at code.claude.com; last full pass on CLI 2.1.222. **Re-verify on each
Claude Code or model release; the launch-flag fact also on a desktop app release.** Facts marked *(probe)* are local observations, not
documentation, and re-verify the same way.

Load limits and delivery:

- `MEMORY.md`: first 200 lines or 25KB, whichever comes first; content past the cap is
  silently dropped. Frontmatter and block-level HTML comments are stripped before
  measuring (v2.1.211+).
- Skill listing: 1,536 characters per entry (`skillListingMaxDescChars`); the listing
  overall gets 1% of the context window (`skillListingBudgetFraction`, or
  `SLASH_COMMAND_TOOL_CHAR_BUDGET` for a fixed count).
- `@path` imports in `CLAUDE.md`: maximum depth 4; imported files expand at launch and
  buy back no context.
- `CLAUDE.md` is delivered as a user message after the system prompt and loads in full
  at any length; the 200-line target is a recommendation, not a cap.
- `CLAUDE.md`/`AGENTS.md` reach every subagent except the built-in Explore and Plan.
- Discovered `CLAUDE.md` files are concatenated, not overridden, loaded managed
  policy → user → project → local, so a project file does not supersede the user file
  and a cross-level contradiction stays live in context.
- Nested `CLAUDE.md` files load on demand when files in their directory are read, not
  at launch.
- `.claude/rules/`: a rule without `paths:` frontmatter loads at launch at
  `.claude/CLAUDE.md` priority; with `paths:` it triggers on matching reads and is not
  re-injected after compaction. Whether a no-`paths` rule survives compaction is
  unrecorded: do not assert it either way.
- A skill body enters context once and is never re-read; re-invoking an unchanged skill
  appends an already-loaded note rather than a second copy (v2.1.202+). Compaction
  re-attaches each skill's most recent invocation, first 5,000 tokens, under a combined
  25,000-token budget.
- Auto memory is on by default, per-project, machine-local, and never loaded into a
  non-fork subagent.
- Session transcripts live at
  `${CLAUDE_CONFIG_DIR:-$HOME/.claude}/projects/<slug>/<session-id>.jsonl`, where
  `<slug>` is the cwd with `/`, `.`, spaces, and `~` collapsed to `-` *(probe,
  2.1.226)*.
- `$CLAUDE_CODE_SESSION_ID` is set in Claude Code sessions *(probe, 2.1.226)*.
- The desktop app launches the CLI with `--permission-mode auto
  --allow-dangerously-skip-permissions` *(probe: `ps` on a live session, desktop app
  1.32352.1, CLI 2.1.229)*.

Tool, permission, and invocation fields:

- A skill's `allowed-tools` pre-approves for the invoking turn; it does not restrict.
  `disallowed-tools` restricts. Both lapse at the next user message, so neither is a
  durable boundary; treating either as one is a false boundary.
- `user-invocable: false` is Claude-only menu hiding; the description stays in context.
  `disable-model-invocation: true` blocks programmatic invocation, and *(probe)*
  removes the skill from the model's skill listing.
- A skill's `context: fork` inherits no caller context: the opposite of a
  conversation fork, which inherits the entire conversation. The two share a word and
  invert the behavior.
- A background subagent keeps every MCP tool but only these built-in tools: `Read`,
  `Grep`, `Glob`, `Bash`, `PowerShell`, `Edit`, `Write`, `NotebookEdit`, `WebFetch`,
  `WebSearch`, `TodoWrite`, `Skill`, `ToolSearch`, `EnterWorktree`, `ExitWorktree`,
  `Monitor`, `TaskStop`, `SendMessage`, `Artifact` *(sub-agents reference, 2026-08-06
  pass)*. The narrowing subtracts from the `tools` field and never adds to it, and a
  `tools` list resolving to nothing usually fails the agent at launch.
- A sub-agent's `tools` restricts; `disallowedTools` subtracts from inherited or
  specified tools.
- Permission rules evaluate deny → ask → allow; the first match wins and specificity
  does not reorder, so a broad deny cannot carry allowlist exceptions. A bare tool name
  in `deny` removes the tool from context entirely; a scoped rule only blocks matching
  calls.
- `skillOverrides` has four states: `on`, `name-only`, `user-invocable-only`, `off`;
  absent means `on`. Keys match the skill name, so two skills sharing a name share one
  entry *(probe, 2.1.226)*. It does not apply to plugin skills.
- Settings changes reload mid-session (documented for `permissions`, `hooks`,
  credential helpers). A hook script body also takes effect mid-session *(probe,
  2.1.221)*.
- Hook reach is per event, not main-thread-only: tool events like `PreToolUse` and
  `PostToolUse` fire inside subagents too. Plain hook stdout becomes model-visible
  context only for `UserPromptSubmit`, `UserPromptExpansion`, and `SessionStart`, which
  subagents never fire; a `PostToolUse` hook injects model-visible text through
  `hookSpecificOutput.additionalContext` instead *(probe, 2.1.221)*; whether
  `PreToolUse` shares the channel is unrecorded.
- Workflow-spawned subagents run in `acceptEdits` and inherit the session's tool
  allowlist regardless of permission mode.
- `Agent` tool `name`: a named spawn has returned only a receipt in place of its report
  *(probe, 2.1.220–2.1.221)*. Two explanations remain open: an agent-team teammate
  mechanism, or an ordinary named background spawn; and the probes run so far cannot
  separate them. Do not restore either as settled.

Mirror mark: the numeric limits and several loading-path and tool-field facts above are
restated in `agents/instructions-reviewer.md` and
`agents/references/dispatch-fields.md`; the named-spawn fact in
`rules/subagent_spawning.md`; the transcript layout in `skills/kaizen/SKILL.md`
§Assemble the evidence; the `skillOverrides` key rule in
`skills/art-direction/SKILL.md`: edit those sites with this list or neither.

## Deprecated model mechanics

**Re-verify on each model release**, against the extended-thinking reference and the
newest model's prompting page at platform.claude.com; last checked against the Opus 5 /
Fable 5 release pages. The old prefill documentation path redirects and states none of
these.

- **Prefilled last-assistant-turn responses** return 400 starting with Claude 4.6 and
  Claude Mythos Preview. Only the last assistant turn is refused; earlier assistant
  messages and earlier models are unaffected. Migrate to Structured Outputs, direct
  instruction, XML output tags, or tool calling.
- **`budget_tokens` thinking caps** ride on `thinking: {type: "enabled"}`. Three
  tiers: functional on Claude 4.5 and earlier; deprecated but succeeding on Opus 4.6
  and Sonnet 4.6; 400 on Claude 4.7 and later (Opus 4.7, 4.8, 5; Sonnet 5; Fable 5;
  Mythos 5: not Mythos Preview). Replacement: `thinking: {type: "adaptive"}` plus
  `output_config: {effort: ...}`, with `max_tokens` still the ceiling.
- **Rules telling the model not to think** increase tag leakage; remove them, and
  avoid naming thinking tags: the effective general form is "Do not include internal
  or system XML tags in your response." Vendor-asserted mechanism, no measurement,
  stated about Opus 5 with thinking disabled. The vendor's primary remedy is keeping
  thinking on at low effort.

## Cited sources, and what each licenses

Each entry names its `prompts`-vault page; the page's Evidence block wins over the
summary here. Every source below supports a mechanism argument unless its entry states
a measurement.

Measured nothing (vendor docs, practitioner guides: re-check per release; last
checked against the Opus 5 / Fable 5 release pages):

- *Writing Great Skills (Pocock)*: practitioner guide, pinned to a commit; upstream
  was renamed and rewritten after the pin, so the pin holds the old text. Backs the
  keep-side deletion test and the user-invoked description rule only; it states no
  "skip when" rule.
- *Anthropic Prompting Best Practices* and *Claude Code Instruction-Artifact
  Mechanics*: vendor documentation behind the Harness-mechanics list.
- *AGENTS.md as a Cross-Agent Convention*: a convention; carries adoption only.
- *The New Rules of Context Engineering (Anthropic 2026)*: six "then vs now"
  reversals. Its one number (over 80% of the system prompt removed "with no measurable
  loss") names no eval or method: it licenses "old-model guardrails the model now gets
  right by judgment are removable", never "cut your corpus". Load-bearing reversals:
  tool-usage examples constrain exploration (design expressive interfaces instead);
  tool guidance belongs in tool descriptions, not the system prompt; prefer rich
  references in code over prose descriptions.
- *A Field Guide to Claude Fable 5 (Anthropic 2026)*: the judgment-displacement
  mechanism (too specific → faithful compliance even when wrong; too vague → generic
  defaults). Single-author experience, zero measurement.
- *Effective Context Engineering for AI Agents (Anthropic 2025)*: "right altitude",
  minimal-does-not-mean-short, canonical examples over edge-case lists. Its
  context-rot numbers belong to Chroma's research, not this post.
- *Building Verification Loops in Claude Code with Skills (Anthropic 2026)*: the
  fired-probe check (invoke the skill fresh and confirm the new step runs). Stated
  about skills; extended to sub-agent bodies by argument.
- *Dynamic Workflows in Claude Code (Anthropic 2026)*: source of the
  workflow-subagent `acceptEdits` fact; version-annotated and the most volatile source
  in the vault.

Measured something (papers: quote the split before resting a finding on one):

- *What Prompts Don't Say (Yang et al. 2025)*: an omitted requirement was inferred
  correctly in 41.1% of cases; omission cost 22.6% accuracy on average. Requirements
  followed at 98.7% individually fell to 79.7–85.0% when 19 were specified together:
  adherence is a budget, and each added requirement taxes the others. Licenses:
  leaving a requirement to inference is unreliable. Does not license: that authored
  scope statements improve compliance: the remedy was never tested in that form.
- *Coding Agents Are Guessing (Ji et al. 2026)*: 55.8–67.8% of *acted* runs violated
  a boundary (27.0–46.3% over all scored runs: quote the denominator). Small/fast
  models only, no frontier model. The nearest tested intervention was null: agents do
  not self-restrain on stated consequence severity. Does not test explicit
  out-of-scope declarations.
- *Semantic Collapse (Richter and Papadakis 2026)*: models collapse onto a single
  incorrect interpretation, "coherent but behaviorally misaligned", instead of
  surfacing ambiguity; detrimental collapse on 10–16% of MBPP, rising up to 5.53×
  under injected underspecification. Also licenses: inconsistency is a real signal of
  model uncertainty; its absence is not evidence of correctness.

## Rejected citations: do not restore

A rule ("a schema, vocabulary, or language restriction on the reasoning step costs
accuracy") was written from a spec's paper summaries, shipped, and reverted the same
day: zero true positives, one costly false positive. The sources, and why each cannot
back that rule:

- *Let Me Speak Freely? (Tam et al. 2024)*: 2024 non-reasoning models; found
  JSON-mode *helps* classification; contested by a matched-prompt re-run. The one
  clause that holds: performance recovers when unconstrained reasoning precedes
  constrained output.
- *Multilingual CoT (Zhao et al. 2025)*: its collapse case is a competence effect in
  a low-resource language; argues against nothing about English reasoning.
- *CoT Is Not Explainability (Barez et al. 2025)*: a position paper; its 25% figure
  is a share of surveyed papers misusing CoT, not an unfaithfulness rate, and its own
  recommendation is to corroborate CoT, not discard it. **Still permitted:** cited only
  for what a transcript measurement is *not*. Do not restore the 25% figure.
- *Concise Reasoning, Big Gains (Wu et al. 2025)*: a CoT-distillation paper; makes no
  correct-vs-incorrect length claim. The length finding belongs to *Concise Reasoning
  via RL (Fatemi et al. 2025)*, a PPO/GRPO training artifact licensing no claim about
  prose style.

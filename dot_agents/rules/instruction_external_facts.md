# External Facts Behind the Instruction Review Checklist

Every external fact an instruction artifact cites **and this file has audited**, with its
verification date and what the source actually established. A numeric or outcome claim in any instruction
artifact that is not listed here is unaudited — treat it as a mechanism argument and never
cite it as measured. The reviewer has no documentation or web
access, so re-verification is the author's job. Cite a fact from here **with the label the
section prints beside it, never with a date alone** — the `###` heading that established it
(`§1, 2026-08-05 re-verification`; `§2, 2026-08-05 verification`), `§1 standing list` when
only the standing list carries it, a §3 page's `retrieved:` date, or the bolded label a §3
or §4 note prints (`recorded 2026-07-27`, `scope correction 2026-08-05`). The test is
whether the label survives the next re-check: a `###` heading and a bolded label do, an H2
date does not — §1's heading is re-dated on every pass, so never cite it as a fact's anchor.
The one place a §1 date is right is the `Blocker [unverified — dated <date>]` label, which
reports recency, not provenance; §1's own paragraph says which date fills it, and it is the
date of the anchor carrying the fact, not of the heading. A §3 `retrieved:` date moves too, when the page
is refetched, so a refresh is an
edit to every site citing that page; name those sites in the §3 entry, as the mattpocock
entry does. What is never right is a section number with a bare date and no label.

1. Harness mechanics — numeric limits and field semantics, dated
2. Deprecated model mechanics
3. Cited sources, and what each measured — measured nothing / measured something
4. Rejected citations — do not restore

## 1. Harness mechanics — standing list verified 2026-08-05, extended 2026-08-06 (CLI 2.1.222)

Covers the numeric limits and field semantics in §1–§2 and §8 of the checklist: load
limits, import depth, listing caps, tool-field behavior, and what reaches a sub-agent.
A checklist claim resting on Claude Code harness documentation cites **this section by its
anchor**; §3 records the sources behind it (page *Claude Code Instruction-Artifact
Mechanics*). A harness mechanic this section carries is cited by its anchor, per the citation
rule above: `§1, 2026-08-03 re-verification` when a dated subsection enumerates it; `§1
standing list, 2026-08-03 pass` when the standing list carries it and only this section's
opening paragraph names the pass that added it; `§1 standing list, 2026-07-25 first verified`
when it predates the subsections. Every form names an anchor no later re-check
moves.
A mechanic this section does not carry gets its own §3 entry (`AGENTS.md` §Task lifecycle
states the same rule).

First verified 2026-07-25; re-verified 2026-08-03, and again 2026-08-05 on CLI 2.1.222,
against the live memory, skills, sub-agents, and settings references at
code.claude.com/docs (page *Claude Code Instruction-Artifact Mechanics*; the vault raw
notes still carry `fetched: 2026-08-03` — the 2026-08-05 pass read the live pages
directly and did not refresh them, so §3's dates lag §1's by two days). Every fact the
checklist cites held on every pass, with one qualification added 2026-08-03:
`CLAUDE.md`/`AGENTS.md`
reach every subagent *except* the built-in Explore and Plan agents, which skip them —
the checklist's §1 Loading-path bullet now carries it. The *Anthropic Prompting Best
Practices* page carries `retrieved: 2026-07-30`; *Claude Code Instruction-Artifact Mechanics*
was re-fetched 2026-08-03 (§3 carries both dates).

**Re-verify trigger:** each Claude Code or model release.
**Settling step for a disputed one:** re-check the sub-agents / skills / memory reference.

**Standing list — numerics (re-verified 2026-08-05 on CLI 2.1.222, page *Claude Code
Instruction-Artifact Mechanics*; these five are mirrored in
`agents/instructions-reviewer.md` §1–§2, the skill-listing entry as its 1,536 cap only —
edit both or neither):**

- `MEMORY.md`: first 200 lines or 25KB, whichever comes first; content past the cap is
  silently dropped on the next load. Frontmatter and block-level HTML comments are
  stripped before the index is measured and loaded, so they do not count (v2.1.211+;
  added here 2026-08-05, where `agents/instructions-reviewer.md` §1 already carried it).
- Skill listing: 1,536 characters per entry (`description` + `when_to_use`; configurable
  via `skillListingMaxDescChars`); the listing overall gets 1% of the context window
  (`skillListingBudgetFraction`, or `SLASH_COMMAND_TOOL_CHAR_BUDGET` for a fixed count).
- `@path` imports in `CLAUDE.md`: maximum depth 4.
- `CLAUDE.md` is delivered as a user message after the system prompt and loads in full at
  any length; the 200-line target is a recommendation, not a cap.
- `CLAUDE.md`/`AGENTS.md` reach every subagent except the built-in Explore and Plan.

A **Blocker** resting on any of these is reported in the reviewer's form
(`agents/instructions-reviewer.md`, `Blocker [unverified — dated YYYY-MM-DD]`) with the
standing list's date filled in: `Blocker [unverified — dated 2026-08-05]`. A Blocker resting on a
fact a dated subsection below carries takes **that subsection's** date instead — the label reports
the recency of the fact, not of the section it sits in, and later passes add subsections rather
than re-verifying the whole section (first true of the 2026-08-06 pass).

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

### 2026-08-05 re-verification — CLI 2.1.222

The 2.1.221 → 2.1.222 bump fired the trigger; this pass closed it against the live
memory, skills, sub-agents, and settings references. **All five standing numerics held
unchanged**, as did the plugin-skill exemption, the memory load order, the `#`-quick-add
withdrawal, and the Explore/Plan qualification. Four additions and one retraction:

- **`MEMORY.md`'s cap ignores frontmatter and block-level HTML comments** (v2.1.211+), now
  in the standing bullet above; `agents/instructions-reviewer.md` §1 already carried it, so
  the mirror is back in sync.
- **The 1,536 cap and the 1% budget have setting names**, now in the standing bullet:
  `skillListingMaxDescChars` and `skillListingBudgetFraction` (or
  `SLASH_COMMAND_TOOL_CHAR_BUDGET` for a fixed character count). "Configurable" without
  the key was not actionable.
- **A settings change is re-read mid-session, and this is now documented** rather than only
  observed: "Claude Code watches your settings files and reloads them when they change, so
  edits to most keys apply to the running session without a restart. This includes
  `permissions`, `hooks`, and credential helpers like `apiKeyHelper`" (settings reference,
  no version annotation — so it is not pinned to any release, 2.1.222 included). This
  covers the *registration* half only. The **hook script body** taking effect mid-session
  stays a probe result, observed 2.1.221 / 2026-08-04
  (`dot_claude/hooks/executable_instruction-gate.sh` header carries the probe); it was not
  re-run at 2.1.222. `AGENTS.md` §Precedence rests on both halves and cites this section.
- **Auto memory gained `autoMemoryDirectory`** (any settings scope; from project or local
  settings it is honored only after the workspace-trust dialog) and a `modified` ISO-8601
  frontmatter timestamp written on every write to a file that already has frontmatter
  (v2.1.214+). Neither is cited by the checklist yet.
- **Retraction — `name` on the `Agent` tool.** The sub-agents reference supplies a
  team-independent explanation, describing a named spawn as an ordinary **background
  subagent**, not a teammate: the sibling roster appears when "at least one other agent has
  a name, whether Claude named it when spawning it or it runs as an agent team teammate",
  and `SendMessage`'s v2.1.199 identity check exists for "a re-spawned background agent
  that reused it". It also explains the observed symptom without teams: background is the
  subagent default from v2.1.198, and "a background subagent's results reach Claude as a
  completion notification in a later turn". **Two explanations remain open and the
  2026-08-04 probe cannot separate them** — teams were enabled when it ran, so the
  `~/.claude/teams/<session>/config.json` `members` entry is equally consistent with the
  teammate mechanism and with an ordinary named background spawn. The old reason is
  retracted, not disproved; do not restore either as settled. A separate, weaker
  observation: with teams off on 2.1.222 the `Agent` tool appeared to expose no `name`
  property at all — read from inside the session, so unsettled, and the settling probe is a
  spawn with `name` set. `rules/subagent_spawning.md` §Why no `name` carries both.

**§2 was settled separately the same day** — see its `### 2026-08-05 verification` heading,
which also records the dead prefill path that cost the first attempt.

### 2026-08-06 verification — the four tool-field and invocation mechanics

Opened because `agents/instructions-reviewer.md` rested findings, one of them a **Blocker**, on
four mechanics no section here carried. Read live from the skills and sub-agents references at
code.claude.com on CLI 2.1.222. **All four held**; nothing needed correcting, and two
imprecisions in the checklist's wording were tightened. Cite these as
`§1, 2026-08-06 verification`.

- **A skill's `allowed-tools` pre-approves, it does not restrict.** Verbatim: "Tools Claude can
  use without asking permission during the turn that invokes this skill. The grant clears when
  you send your next message." The restrictive field is `disallowed-tools`, and its row states the
  same boundary in its own words: "Tools removed from Claude's available pool while this skill is
  active … The restriction clears when you send your next message." Both durations are quoted,
  neither inferred. So treating `allowed-tools` as a safety boundary is a false boundary, as the
  checklist's §2 says.
- **A background subagent's tool set is narrowed, and the narrowing beats the `tools` field.**
  Verbatim: "a background subagent keeps every MCP tool but only these built-in tools: `Read`,
  `Grep`, `Glob`, `Bash`, `PowerShell`, `Edit`, `Write`, `NotebookEdit`, `WebFetch`, `WebSearch`,
  `TodoWrite`, `Skill`, `ToolSearch`, `EnterWorktree`, `ExitWorktree`, `Monitor`, `TaskStop`,
  `SendMessage`, and `Artifact`. Claude Code removes every other built-in tool from a background
  subagent, whether inherited or listed in the `tools` field, so the same definition can resolve
  to different tools in the foreground and the background." Two corrections to the checklist's
  wording: it said "keeps only a fixed built-in set" and dropped that **every MCP tool survives**;
  and a `tools` list resolving to nothing "**usually**" fails the agent at launch, not always.
- **`user-invocable: false` is Claude-only and its description stays in context.** The invocation
  table gives it User-invocable **No**, Claude-invocable **Yes**, "Description always in context,
  full skill loads when invoked." One scope the checklist should not overstate: "The
  `user-invocable` field only controls menu visibility, not Skill tool access. Use
  `disable-model-invocation: true` to block programmatic invocation."
- **A skill's `context: fork` inherits no caller context.** Verbatim: "Add `context: fork` to your
  frontmatter when you want a skill to run in isolation. The skill content becomes the prompt that
  drives the subagent. **It won't have access to your conversation history.**" **Do not confuse
  this with a conversation fork**, which is the opposite: "A fork is a subagent that inherits the
  entire conversation so far instead of starting fresh" (`/subtask`, sub-agents reference). The
  two mechanisms share the word and invert the behavior, which is the trap this entry exists to
  keep shut. Also true and unused by the checklist so far: a *backgrounded* forked skill takes the
  narrow background tool set above, because "the skill's subagent is a regular agent type, so the
  exemption for subagents that fork the conversation doesn't cover it."

**Mirrors this subsection creates.** `allowed-tools` and `context: fork` are mirrored once each in
`agents/instructions-reviewer.md` §2 *Tool fields are not one mechanism* and *Forked / isolated
skills*. `user-invocable: false` mirrors into **two** §2 bullets, each carrying the half its check
needs: the description half in *Invocation mode sets what the description is for*, the boundary
half in *Tool fields*. The background entry's **list** is pointed at from *Sub-agent `tools`
resolves differently by run mode*, not copied — keep it that way, it is the one list long enough
that a second copy would drift — but its two corrections travel with it as text there (every MCP
tool survives; a list resolving to nothing "usually" fails at launch). Edit every site or none.

**Vault gap, opened 2026-08-06.** These came from a live primary read; the `prompts` page *Claude
Code Instruction-Artifact Mechanics* still carries `retrieved: 2026-08-03` and is **silent** on all
four fields. Silence is not a conflict — the page states nothing to disagree with — so
`using_the_wiki.md` §"No page is not an outage" applies here **by extension**: its stated condition
is a source with no page at all, and this is a page silent on four of its fields. Either way this
section is the record and the page-wins rule is not suspended; it applies unchanged the moment the
refresh lands. §3's entry for that page names the gap. A third branch in `using_the_wiki.md` for
the silent-page case would retire this extension.

### 2026-08-06 verification, second pass — loading-path carriers

Opened to close the rest of the checklist's unanchored mechanics, the ones the first pass left.
Read live from the memory, skills, sub-agents, and hooks references on CLI 2.1.222. Cite as
`§1, 2026-08-06 second pass`. **Eight held**, two of them correcting a checklist wording that was
incomplete rather than false. **One checklist claim was wrong outright, and one carrier was
missing entirely.**

Held, each now citable:

- **`@path` imports expand at launch and buy back no context.** "Imported files are expanded and
  loaded into context at launch alongside the CLAUDE.md that references them", "a maximum depth of
  four hops", and, verbatim from the troubleshooting section: "Splitting into `@path` imports helps
  organization but doesn't reduce context, since imported files load at launch."
- **`CLAUDE.md` is a user message, not system prompt.** "CLAUDE.md content is delivered as a user
  message after the system prompt, not as part of the system prompt itself."
- **A skill body is never re-read.** "the rendered `SKILL.md` content enters the conversation as a
  single message and stays there for the rest of the session … Claude Code does not re-read the
  skill file on later turns, so write guidance that should apply throughout a task as standing
  instructions rather than one-time steps." Two mechanics the checklist does not carry and may
  want: re-invoking a skill whose rendered content is unchanged appends a short already-loaded note
  rather than a second copy (v2.1.202+), and auto-compaction re-attaches the most recent invocation
  of each skill keeping the first 5,000 tokens, under a combined 25,000-token budget, so older
  skills can drop out entirely.
- **Auto memory never reaches a non-fork subagent.** "The main conversation's auto memory isn't
  loaded into subagents; the exception is a fork … A subagent's own auto memory, enabled with the
  subagent `memory` field, is a separate directory."
- **`skillOverrides` has exactly four states**, and the table gives each one's two effects: `on`
  (name and description listed, in the `/` menu), `name-only` (name only, in the menu),
  `user-invocable-only` (hidden from Claude, in the menu), `off` (hidden from both). "A skill that
  is absent from `skillOverrides` is treated as `"on"`."
- **A sub-agent's `tools` restricts and `disallowedTools` subtracts.** "`tools` — Tools the
  subagent can use. Inherits every tool available to subagents if omitted"; "`disallowedTools` —
  Tools to deny, removed from inherited or specified list."
- **Permission rules evaluate deny → ask → allow, and specificity does not reorder them.**
  Verbatim: "Rules are evaluated in order: deny, then ask, then allow. The first match in that
  order determines the outcome, and rule specificity doesn't change the order." The consequence an
  author gets wrong: "A broad deny rule like `Bash(aws *)` blocks every matching call, including
  calls that also match a narrower allow rule like `Bash(aws s3 ls)`, so a deny rule can't carry
  allowlist exceptions." The checklist said only "`deny` beats `allow`", which drops `ask` and
  drops the specificity clause. Also load-bearing for the least-privilege bullet: a bare tool name
  in `deny` "removes the tool from Claude's context entirely", while a scoped rule leaves the tool
  available and blocks matching calls.
- **Nested `CLAUDE.md` files load on demand, not at launch.** "Claude also discovers `CLAUDE.md`
  and `CLAUDE.local.md` files in subdirectories under your current working directory. Instead of
  loading them at launch, they are included when Claude reads files in those subdirectories." The
  checklist's §8 said "auto-load by directory", which reads as at-launch.

**Wrong, and corrected in the checklist: hook reach is per event, not main-thread-only.** The
checklist said "hook injections (each main-thread prompt — never subagents)". The hooks reference
says the opposite of the second half: "Hooks from settings files, managed policy settings, and
plugins also run inside subagents. When a subagent calls a tool, tool events such as `PreToolUse`
and `PostToolUse` fire the same configured hooks as in the main conversation, and the input carries
the `agent_id` and `agent_type` … fields that identify the subagent." What *is* main-thread-only is
the **event**, not the hook: stdout becomes model-visible context only for `UserPromptSubmit`,
`UserPromptExpansion`, and `SessionStart`, and a subagent has no user prompt. So a
`UserPromptSubmit` injection reaches main-thread prompts only, while a `PostToolUse` hook that
injects instruction text reaches subagents too — which is what
`dot_claude/hooks/executable_instruction-gate.sh` does, and matches the 2026-08-04 probe recorded
in its header.

**Missing carrier: `.claude/rules/`.** The checklist's loading-path list never named it. "Rules
without [`paths` frontmatter] are loaded at launch with the same priority as `.claude/CLAUDE.md`",
and a rule *with* `paths:` is conditional — "Path-scoped rules trigger when Claude reads files
matching the pattern, not on every tool use." User-level rules in `~/.claude/rules/` load before
project rules. Compaction treats **path-scoped** rules differently from the project root file:
"Project-root CLAUDE.md survives compaction … Nested CLAUDE.md files in subdirectories and rules
with `paths:` frontmatter are not re-injected automatically." The quote covers the `paths:` kind
only — whether a rule without `paths:` survives is **unrecorded**, so do not assert it either way.

**Mirrors this subsection creates.** Nearly every item above is **restated** in
`agents/instructions-reviewer.md`, not merely anchored — edit each site with this section or
neither. In §1 *Loading-path integrity*: the corrected hook-reach clause, the `.claude/rules/`
carrier, `@path` depth-and-expand-at-launch, `CLAUDE.md`-as-user-message, and auto memory never
reaching a non-fork subagent. In §1 *Skill bodies persist*: the never-re-read rule. In §1
*Per-file budgets*: the `.claude/rules/` compaction split. In §2 *Tool fields*:
`tools`/`disallowedTools`. In §2 `permissions`: the `deny` → `ask` → `allow` order. In §8: nested
`CLAUDE.md` loading on demand. The `skillOverrides` **table** — each state's two effects — is
uncopied, but the state names `name-only` / `user-invocable-only` / `off` are restated in §1
*Loading-path integrity* and §4 *Tool guidance duplicated across carriers*, so a renamed or added
state is an edit to both.

**Vault gap.** Same as the first pass: the `prompts` page *Claude Code Instruction-Artifact
Mechanics* (`retrieved: 2026-08-03`) is silent on all of these. §3's entry names it.

## 2. Deprecated model mechanics

Moved here 2026-07-27 from the inline "Deprecated model mechanics" rule, where it arrived
undated. Cite as `§2, 2026-08-05 verification` — the `###` heading below, which later passes
add to rather than overwrite.

**Re-verify trigger:** each model release. **Settling step:** the extended-thinking reference
and the per-model prompting page for the newest model — **not** the old prefill path, which
302s to `platform.claude.com`'s prompt-engineering overview and states none of these
(2026-08-05).

### 2026-08-05 verification — prefill, `budget_tokens`, the don't-think rule

Read primary from `platform.claude.com`: the extended-thinking reference, the
prompting-best-practices page, and *Prompting Claude Opus 5*. Cross-checked against the vault
page *Anthropic Prompting Best Practices*, which carries the first two. It agrees on both
deprecation sets; it is **stale on the replacement field** ("Use `effort`",
`retrieved: 2026-07-30`) and this section's live read supersedes it there — a page refresh is
owed, and until it lands the house "the page wins" rule does **not** apply to that field. The
page also carries a third mechanic this section does not: thinking defaults by model. All
three entries below held; each gained a scope the earlier undated version had dropped.

- **Prefilled last-assistant-turn responses** — 400 "starting with Claude 4.6 models and
  Claude Mythos Preview". **Scope added 2026-08-05:** only the *last* assistant turn is
  refused — "adding assistant messages elsewhere in the conversation is not affected" — and
  earlier models still support prefill. Migrate to Structured Outputs, direct instruction
  ("Respond directly without preamble"), XML output tags, or tool calling; for
  classification, a tool with an enum field.
- **`budget_tokens` thinking caps** — the field rides on `thinking: {type: "enabled"}`, and
  that is what the API refuses. **Three tiers, corrected 2026-08-05:** functional on Claude
  4.5 and earlier (the only mode there); deprecated but still succeeding on Opus 4.6 and
  Sonnet 4.6; **400 on Claude 4.7 and later** — named: Opus 4.7, Opus 4.8, Opus 5, Sonnet 5,
  Fable 5, Mythos 5. Claude Mythos *Preview* supports both modes, so it is not in the refusing
  set. Replacement is `thinking: {type: "adaptive"}` plus `output_config: {effort: ...}` — the
  nested field, not a bare `effort` — with `max_tokens` still the hard ceiling.
- **Rules telling the model not to think or reason** — verbatim, *Prompting Claude Opus 5*
  §Running with thinking disabled: "If your system prompt contains a rule instructing the
  model not to think or not to reason, remove it; that kind of instruction increases tag
  leakage", and "Instructions that call out thinking tags by name are less effective than the
  general form, so avoid naming them specifically." The general form is "Do not include
  internal or system XML tags in your response." **Vendor-asserted, no measurement** — the
  page reports no experiment, so this is a mechanism argument, never an outcome claim.
  **Scope added 2026-08-05:** stated about Claude Opus 5 with thinking *disabled*, not about
  models generally. Two further facts from the same section: a second artifact appears there —
  the model "occasionally writes a tool call into its user-facing text instead of emitting a
  structured `tool_use` block", the call never runs, and in an agentic loop the leaked text
  persists in history; and the page's own primary remedy is not the instruction at all but
  keeping thinking on — "for most tasks, thinking enabled at `low` effort performs better than
  thinking disabled at similar cost" — the same vendor assertion with no experiment behind it;
  cite it as a mechanism argument, never as a benchmark result.

This set grows.

## 3. Cited sources, and what each measured

Cite any source below **with its page's `retrieved:` date**, except where the page also
backs a §1 harness mechanic — then cite §1 plus the dated subsection that established the
mechanic (§1's rule paragraph gives the form). The vault's Lint 2(b) sweeps
those dates because "the current release" is not observable from inside the vault.

**Measured nothing.** All three now have `type: source` pages in the `prompts` vault,
`provenance: primary`, each carrying `Claim type: mechanism` — which is where the
never-an-outcome-claim rule below is now recorded formally, per source.

- mattpocock's *Writing Great Skills* is a practitioner guide. Page: *Writing Great Skills
  (Pocock)* (retrieved 2026-07-30; scope correction verified against upstream 2026-08-05,
  page not refreshed — cite that date for the correction, 2026-07-30 for the rest). Pinned to
  a commit, so it moves only when the pin does.
  **Citing sites, all in `agents/instructions-reviewer.md` — a page refresh is an edit to each:**
  §Operating notes "Deletions have a keep-side test"; §2 "Invocation mode sets what the
  description is for"; and §7 Completion gate, whose example pair "every modified model accounted
  for" / "produce a change list" is **verbatim** from the source and was uncited until 2026-08-06.
  `git log -S` dates that text to `b4f9d77` (2026-06-26), three weeks before this entry existed,
  so it is derivation rather than convergence.
  **Upstream renamed *and rewritten*** on 2026-07-23 (`1fc6573`): not a rename with the text
  held, as this entry said until 2026-08-06 — `git diff --stat 697d4ce..HEAD` is 289 deletions,
  including the whole 201-line `GLOSSARY.md`, replaced by 103 lines across `SKILL.md` and
  `SKILL-MECHANICS.md`. The pin holds the **old** text, and the page's title no longer resolves
  upstream. Concept-by-concept the two overlap almost entirely; the one idea added after the pin
  is the environment-as-source-of-truth "cache" test (`f054def`, 2026-07-28), which this page has
  never covered and which the 2026-08-06 study rejected against §3 *Reference over restatement*
  (`.boris/2026-08-06-writing-for-agents-study.md`). **Scope correction,
  2026-08-05:** the source backs only the user-invoked half — "the `description` becomes
  human-facing — a one-line summary, trigger lists stripped" (pinned page, line 22). It
  states no "skip when" rule — verified negative against the pinned page, the renamed
  `writing-for-agents/` at HEAD, and the full upstream git history.
  `agents/instructions-reviewer.md` §2 carries that check as a labelled house delta.
- The Anthropic prompting-best-practices pages (size and dispatch limits, "XML tags as
  delimiters") are vendor documentation, so re-check them per release. Pages: *Anthropic
  Prompting Best Practices* (retrieved 2026-07-30) and *Claude Code Instruction-Artifact
  Mechanics* (retrieved 2026-08-03). The best-practices page was **read live 2026-08-05**
  for §2; the vault page was not refreshed, so its `retrieved:` date still reads 2026-07-30
  and a §2 claim cites §2's anchor, not this one. **Gap, 2026-08-06:** the *Instruction-Artifact
  Mechanics* page is silent on the four tool-field and invocation mechanics §1's
  `### 2026-08-06 verification` records, all read live that day. Refreshing the page must pick
  them up; until it does, cite §1's subsection, not this entry.
- **Vault gap, opened 2026-08-05.** Two pages behind §2 have no `prompts` vault page yet:
  the *Extended thinking* reference and *Prompting Claude Opus 5*, both on
  `platform.claude.com`, both read primary that day. §2 is self-contained on their content,
  so no claim rests on an unread source — but a §3 entry and two vault pages are owed before
  either is cited from anywhere else.
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
  fresh task and confirm the new step runs"). Never mentions hooks. Stated about skills;
  the checklist extends it to sub-agent bodies by argument (2026-08-05).
- Anthropic's *Dynamic Workflows in Claude Code* (blog 2026-06-02 plus the workflows
  docs reference, both fetched 2026-08-03). Page: *Dynamic Workflows in Claude Code
  (Anthropic 2026)*. Source of §1's workflow-subagent `acceptEdits` fact; the docs page
  supersedes the blog where they disagree (resume semantics), and is version-annotated
  v2.1.154–v2.1.219 — the most volatile source in the vault.

**Measured something — added 2026-07-30, backing "Complement stated?".** All three
primary full texts were fetched and read 2026-07-30 (`retrieved: 2026-07-30`) and now have pages in the `prompts`
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
  discard it. Contested by arXiv 2512.23032. **Still permitted, recorded 2026-07-27:** cited in
  `agents/instructions-reviewer.md` Operating notes *only* for what it is *not* (a transcript
  measurement); that use stands as a mechanism argument, and it is the only permitted one.
  Do not restore the 25% figure or any unfaithfulness rate. (No other §4 entry prints the
  `Still permitted` label. The checklist's §6 keys route three on it.)
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

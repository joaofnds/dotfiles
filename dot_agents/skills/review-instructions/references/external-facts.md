# Probed Facts Behind Instruction Artifacts

What this machine's Claude Code harness and Anthropic's models were observed to do,
each entry with how it was checked and what re-triggers the check. A fact about any
other tool lives with the rules that rest on it, not here.

A claim about the harness or the models that this file does not list is unaudited.
Treat it as a mechanism argument and never cite it as measured. Cite an entry as
`references/external-facts.md` §<heading>.

Record an entry only with a check you ran in the recording session, and re-check a
claim inherited from a report or from memory before it enters. Query the `prompts`
wiki for claims from papers and vendor documentation, since a page there carries the
source's own words and its evidence block.

## Harness mechanics

Read from the memory, skills, sub-agents, settings, hooks, workflows, model-config,
CLI, and SDK references at code.claude.com, last full pass on CLI 2.1.280 on
2026-09-23. **Re-verify on each Claude Code or model release, and the launch-flag
fact on a desktop app release too.** A *(probe)* tag marks a local observation rather
than documentation. A *(DOT-101: name)* tag marks a 2026-09-23 re-check on CLI 2.1.280
and `claude-opus-5-5` unless the entry names another model, one `claude -p` session
per name, kept under `~/code/backlog/boards/dotfiles/evidence/DOT-101/`.

Load limits and delivery:

- `MEMORY.md` loads its first 200 lines or 25KB, whichever comes first, and content
  past the cap is silently dropped. Frontmatter and block-level HTML comments are
  stripped before measuring (v2.1.211+), a clause the 2.1.280 memory reference no
  longer states.
- A memory write past 80% of either `MEMORY.md` cap makes an internal `PostToolUse`
  callback ask for compaction to 70% of that cap, one line per entry with the detail
  moved into topic files *(bundle read and write probe, CLI 2.1.247)*. A read of the
  2.1.280 bundle on 2026-09-24, with no model session, found the same figures,
  instruction, and `PostToolUse` return *(DOT-101 `parent-criteria/memory-thresholds-2.1.280.txt`)*, and the
  write probe was not re-run, because auto memory is off here. The check runs only
  while auto memory is on, and checks the main `MEMORY.md` only while the
  `tengu_moth_copse` flag and `CLAUDE_MEMORY_STORES` are both off, unless a user-scope
  prompt-index setting names it. With either one on, it checks each other `.md` file
  in the memory directory instead, at the same 80% and 70% of 200 lines or 4,096
  bytes, and asks for one fact per file. The 2.1.280 memory reference documents a
  reminder near a limit and an error past one without naming either threshold.
- The skill listing gives each entry 1,536 characters (`skillListingMaxDescChars`)
  and the whole listing 1% of the context window (`skillListingBudgetFraction`, or
  `SLASH_COMMAND_TOOL_CHAR_BUDGET` for a fixed count).
- `@path` imports in `CLAUDE.md` nest at most 4 deep, and imported files expand at
  launch, so they buy back no context.
- `CLAUDE.md` is delivered as a user message after the system prompt and loads in full
  up to 4 MiB, and a larger file is skipped entirely *(memory reference, CLI
  2.1.238)*. The 200-line target is a recommendation, not a cap.
- `CLAUDE.md`/`AGENTS.md` reach every subagent except the built-in Explore and Plan and
  a custom subagent whose definition sets `omitClaudeMd: true`, which still gets managed
  policy files.
- Discovered `CLAUDE.md` files are concatenated, not overridden, loaded managed
  policy → user → project → local, so a project file does not supersede the user file
  and a cross-level contradiction stays live in context.
- Nested `CLAUDE.md` files load on demand when files in their directory are read, not
  at launch.
- Every `.md` file under `.claude/rules/` loads at launch at `.claude/CLAUDE.md`
  priority, subdirectories included, and symlink targets too except in the project
  case below. A rule with `paths:` frontmatter loads on a matching read instead and is
  not re-injected after compaction. Whether a rule without `paths` survives
  compaction is unrecorded, so do not assert it either way. Linking
  `~/.agents/rulebook` as `~/.claude/rules` put its 88 files into every session,
  124,085 input tokens at launch against 2,007 without the link, with `HOME` pointed
  at a copy of `~/.claude` holding a one-line `CLAUDE.md`, which is why the harness
  link is named `rulebook` *(DOT-101: home-rules, home-baseline)*. A project
  `.claude/rules` linked to a directory outside the working directory loaded nothing,
  while a real directory there loaded *(DOT-101: rules-link, rules-real)*. The memory
  reference treats such a link as an external import that loads only after approval,
  and asks for that approval only for an `@path` import, never for a link alone.
- Re-invoking a skill whose rendered content is unchanged returns "Skill /<name> is
  already loaded above; instructions unchanged." with no body. After the file
  changes, the full new body comes back under a header saying the instructions were
  previously loaded *(DOT-101: skill-redelivery, skill-changed)*, and the skills
  reference says changed arguments or new dynamic output re-deliver it too.
  Compaction re-attaches each skill's most recent invocation, first 5,000 tokens,
  under a combined 25,000-token budget, and the reference says a re-invocation after
  compaction restores the full content.
- The `Read` tool returns the full file on every call, a repeat read of an unchanged
  file included, with no already-loaded note *(DOT-101: read-redelivery)*. A rule that
  tells a session to reopen a file therefore delivers the words again, not a pointer.
- A skill's description did not make Sonnet 5 invoke it. Four sessions that ran a
  build or a shaping with "use it when a task's work is finished and before anything
  is called done" in the listing never invoked the skill, while a closing line in the
  body of the running skill did, five of five *(probe, `claude-sonnet-5` on 2.1.261,
  DOT-59)*. On Opus 5.5 at `--effort high` the review ran in all five sessions that
  reached that line, one of which could not read the board rules and gave the build
  skill's next step as its reason *(DOT-101: fire-code-1, fire-code-2, fire-code-3,
  fire-mixed-2, fire-shape-2)*. With the line cut, both code builds still ran the
  review, one quoting the board rules' "every change takes review" and one moving the
  card to Review "per the board rules", so the description alone is unmeasured on
  Opus 5.5 *(DOT-101: nolines-code-1, nolines-code-2)*. A build whose only change was
  a skill file stopped before the line, at review-instructions' evidence gate, which
  needs `claude` runs the probe's permissions refused *(DOT-101: fire-skill-2)*. Every
  Opus 5.5 session that ran the review invoked the router with `Skill` and then the
  skill it routed to, seven of seven, while DOT-59's code builds went straight to the
  code reviewer's skill, three of three, though the corpus also changed between the
  runs. The delivery skill, which the global read table names by path, was opened with
  `Read` in all seven builds that used it, and review-instructions, which the table
  names by path and a hard line names as a skill, was invoked with `Skill` in all four
  that used it. Re-check on a model release, with the board rules' review sentence
  also cut from the description-only arm.
- Auto memory is on by default, per-project, machine-local, and never loaded into a
  non-fork subagent.
- Session transcripts live at
  `${CLAUDE_CONFIG_DIR:-$HOME/.claude}/projects/<slug>/<session-id>.jsonl`, where
  `<slug>` is the cwd with `/`, `.`, spaces, and `~` collapsed to `-` *(DOT-101:
  init-listing, with `~` not exercised)*.
- `$CLAUDE_CODE_SESSION_ID` is set in Claude Code sessions, and a Bash tool call reads
  the same id the stream reports *(DOT-101: session-id)*.
- The desktop app launches the CLI with `--allow-dangerously-skip-permissions` and a
  `--permission-mode` flag, which read `bypassPermissions` in seven of eight live
  sessions and `auto` in one, while the user settings set `defaultMode` to
  `bypassPermissions`. Whether the flag follows that setting or a per-session choice
  is unsettled *(probe: `ps`, desktop app 2.7032.0, CLI 2.1.280, DOT-101
  `runs/desktop-ps.txt`)*.

Tool, permission, and invocation fields:

- A skill's `allowed-tools` pre-approves tools for the invoking turn and does not
  restrict them, while `disallowed-tools` restricts. Both lapse at the next user
  message, so neither is a durable boundary.
- `user-invocable: false` hides the skill from the `/` menu and ignores a typed
  `/name`, and the description stays in context. `disable-model-invocation: true`
  blocks programmatic invocation and removes the skill from the model's listing, while
  the stream's init record still lists it *(DOT-101: dmi)*.
- A skill's `context: fork` inherits no caller context, the opposite of a
  conversation fork, which inherits the entire conversation. The two share a word and
  invert the behavior.
- A background subagent keeps every MCP tool and only the built-in tools the
  sub-agents reference lists for it. That narrowing subtracts from the `tools` field
  and never adds to it, and a `tools` list resolving to nothing usually fails the
  agent at launch.
- A sub-agent's `tools` restricts, and `disallowedTools` subtracts from inherited or
  specified tools.
- `CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH` and `CLAUDE_CODE_MAX_CONCURRENT_SUBAGENTS`
  cap subagents deterministically (CLI 2.1.217+, SDK `max_budget_usd`). A session with
  ultracode active is exempt from the concurrency cap. The SDK's default system prompt
  covers tool calling only. Claude Code's own instructions arrive with the
  `claude_code` preset, which `claude -p` uses by default.
- Permission rules evaluate deny → ask → allow, and the first match wins with no
  reordering by specificity, so a broad deny cannot carry allowlist exceptions. A bare
  tool name in `deny` removes the tool from context entirely, while a scoped rule only
  blocks matching calls.
- `skillOverrides` has four states, `on`, `name-only`, `user-invocable-only`, and
  `off`, and absent means `on`. Keys match the skill name, so two skills sharing a
  name share one entry, and a project skill named like a user skill is the only one
  listed *(DOT-101: override-*, samename-*)*. It does not apply to plugin skills.
- Settings changes reload mid-session (documented for `permissions`, `hooks`,
  credential helpers), and an edited hook script takes effect on its next call
  *(DOT-101: hook-body)*.
- Hooks reach subagents per event, so tool events like `PreToolUse` and `PostToolUse`
  fire inside subagents too. Plain hook stdout becomes model-visible context only for
  `UserPromptSubmit`, `UserPromptExpansion`, and `SessionStart`, which subagents never
  fire, and for `PostModelSwitch`. A `PostToolUse` hook injects model-visible text
  through `hookSpecificOutput.additionalContext` instead *(DOT-101: hook-body)*, and
  the hooks reference gives `PreToolUse` the same field, unprobed.
- A `Stop` hook that blocks with exit 2 appends its stderr as a user message, and the
  session writes a second assistant message after the first, which stays on screen
  and in the transcript *(DOT-101: stop-hook)*. No `Stop` output field in the hooks
  reference edits, hides, or removes the first, so a rewrite driven from `Stop`
  doubles the reply instead of replacing it. `Stop` also accepts `additionalContext`,
  which continues the turn the same way. A `MessageDisplay` hook's `displayContent`
  replaces text on screen only, and the transcript and what the model sees keep the
  original *(hooks reference, unprobed)*. Re-check against the hooks reference's
  `Stop` and `MessageDisplay` output fields.
- `claude -p --output-format json` puts only the final assistant message in `result`,
  so measure a turn's visible reply from the transcript's assistant text records
  *(DOT-101: stop-hook)*. Rehearse reads this same field, so its verdict covers the
  last message and not everything the reader saw *(read 2026-09-22 in its
  `session-attempt.ts`)*.
- Workflow agents use the session's permission rules and get their permission mode
  by the rules for any subagent, and in `claude -p` the `Workflow` call itself goes
  through permission evaluation without a prompt *(workflows reference, unprobed,
  since `disableWorkflows` is on here)*.
- A named `Agent` spawn has returned only a receipt in place of its report *(probe,
  2.1.220–2.1.221)*. Whether that is the agent-team teammate mechanism or an ordinary
  named background spawn is open, since no probe so far separates the two, so do not
  restore either as settled. It was not re-run on 2.1.280.
- A custom output style registers under its frontmatter `name` when present and under
  its filename otherwise, and `--settings '{"outputStyle":"<x>"}'` naming no registered
  style silently loads none *(DOT-101: style-named, style-plain)*. Which file wins when
  two share a `name` is unrecorded, so do not assert it either way. The stream's init
  record names the requested style whether or not it loaded, so confirm a style with
  a quote probe on a sentence only that style contains.
- `claude -p --resume <id>` appends the new turn to the resumed transcript, so a second
  replay of the same fork sees the first replay's prompt and reply. `--fork-session`
  leaves the fork untouched and writes the continuation to a new session id, named by
  the `session_id` field of the `--output-format json` result *(DOT-101: resume-plain,
  resume-fork)*.
- Session effort levels are `low`, `medium`, `high`, `xhigh`, and `max`, set for a
  session by `--effort`, and an unknown value draws a warning naming that set and runs
  at the default *(DOT-101: effort-bogus)*. `--effort ultracode` is accepted without a
  warning, and the CLI reference describes it as `xhigh` with workflow orchestration
  *(DOT-101: effort-ultracode-2)*. Opus 5.5 starts at `medium` unless the environment,
  a flag, `/effort`, or a per-model setting sets a level, and a top-level `effortLevel`
  in the user settings does not count for it. Other current models default to `high`
  *(model-config reference)*.
- Agent-definition frontmatter takes `model` as one of the aliases `sonnet`, `opus`,
  `haiku`, `fable`, a full model id, or `inherit`, and `effort` as a session level
  above. The screener, then pinned `opus` and `low`, ran on `claude-opus-5-5` from a
  `claude-sonnet-5` parent, with no model on the call and with the call passing `opus`
  *(DOT-101: alias-sonnet-nomodel, alias-sonnet-opus)*. A `PreToolUse` hook inside it
  read effort `low` in those runs and under a `claude-opus-5-5` parent with no model
  on the call, while each parent ran at `high` or `xhigh` *(DOT-101:
  alias-opus-nomodel)*. A call passing a model other than the pin was not run, and the
  sub-agents reference ranks the call's model above the definition's. The advisor ran
  on `claude-fable-5-1` while pinned `fable` *(DOT-101: fire-shape-1)*, and its
  current `opus` pin has not been run under a parent on another model. In `claude -p`
  at `medium` effort, a definition written mid-session stayed unknown to the `Agent`
  tool 20 seconds later, and a rewritten one kept its first-loaded model and body,
  while a fresh session spawned the rewrite *(DOT-101: reload-*)*. The sub-agents
  reference says the next spawn picks up an edit within seconds, which these runs did
  not show, so verify an edit to a definition from a fresh session, and re-check
  the pins from fresh sessions too.

Mirror mark: where a rule elsewhere in the corpus rests on a fact above, the two are
edited together. The live copies are the always-loaded rule to read a rule file
again each time the work returns to it, which rests on the `Read` entry, the relay
skill's transcript pointer, the relay and prompt skills' lists of effort levels, the
advisor and screener agent definitions' model and effort pins, the reviewer,
reviewer-medium, and reviewer-low definitions' model and effort pins, the
review-code skill's rule to pass those reviewers no model, the
hard line in your always-loaded instructions that hooks and settings take effect
mid-session, the review-instructions skill's rule under Prefer enforcement to
prose against proposing a Stop hook that rewrites the reply, and its rule under the
behavioral-change evidence to run the comparison through rehearse.

## Writing a person into instruction files

Whether crediting a rule to a person, or naming one in a skill description, changes
what a session does was measured on 2026-09-07 with Sonnet 5 and Opus 5 on Claude
Code 2.1.263, and re-checked on 2026-09-23 with `claude-opus-5-5` on 2.1.280. The
findings, with the conditions that bound each, are in this file as of commit
`b4eb2230` and in the `c4-*` runs under DOT-101's evidence. Re-measure on a Claude
Code or model release before citing any of them.

## What a rule's own wording fails to carry

Whether a rule's wording moves what a session does was measured for rewrites of
corpus lines tested against the vague directive "the sync is too slow, fix it", and
for the reply lengths the brief output style and the /brief skill produce, on
2026-09-07 and 2026-09-08 with Sonnet 5 and Opus 5. Part of it was re-checked on
`claude-opus-5-5` on 2026-09-23 and 2026-09-24. The findings and their conditions are
in this file as of commit `b4eb2230`, in doc-18 and decision-2 on the board, and in
the `r3-live-*` and `c5-*` runs under DOT-101's evidence.
Re-measure the brief style's and the /brief skill's reply lengths with the doc-4
fork-replay on the board on a model swap and before any edit to either file, and
re-measure the rest on a Claude Code or model release before citing it.

## Deprecated model mechanics

**Re-verify on each model release**, against the extended-thinking reference and the
newest model's prompting page at platform.claude.com. Last checked against the Opus 5.5
release pages (What's new, Prompting, and Migrating), fetched 2026-09-22. The Fable 5
and Mythos 5 claims, the prefill claim, the tiers before Claude 4.7, and the entry on
rules telling the model not to think rest on Prompting Claude Fable 5, Prompting
Claude Opus 5, and Prompting best practices, fetched 2026-08-27. The old prefill
documentation path redirects and states none of these.

- **Prefilled last-assistant-turn responses** return 400 starting with Claude 4.6 and
  Claude Mythos Preview. Only the last assistant turn is refused; earlier assistant
  messages and earlier models are unaffected. Migrate to Structured Outputs, direct
  instruction, XML output tags, or tool calling.
- **`budget_tokens` thinking caps** ride on `thinking: {type: "enabled"}`. Three
  tiers: functional on Claude 4.5 and earlier; deprecated but succeeding on Opus 4.6
  and Sonnet 4.6; 400 on Claude 4.7 and later (Opus 4.7, 4.8, 5, 5.5; Sonnet 5; Fable
  5, 5.1; Mythos 5, but not Mythos Preview). `thinking: {type: "disabled"}` returns
  400 on Opus 5.5 and Fable 5.1 as well. Opus 5 accepts it at effort `high` or below,
  and other models are unchecked. Replace either setting with `thinking: {type:
  "adaptive"}` and set `output_config: {effort: ...}`, with `max_tokens` still the
  ceiling.
- **Rules telling the model not to think** increase tag leakage; remove them, and
  avoid naming thinking tags: the effective general form is "Do not include internal
  or system XML tags in your response." Vendor-asserted mechanism, no measurement,
  stated about Opus 5 with thinking disabled. The vendor's primary remedy is keeping
  thinking on at low effort.
- **Show-your-thinking instructions**, which push the model to reproduce its internal
  reasoning in the response text, can be declined under the `reasoning_extraction`
  refusal category. A prompt asking for the reasoning verbatim was declined this way,
  with no model output, on Opus 5.5 and on Opus 5, although the Opus 5.5 pages call the
  category new against Opus 5 *(probe on 2.1.280, one `claude -p` stream-json call per
  model with a prompt asking for its reasoning word for word, category read from
  `stop_details`)*. The vendor also names Fable 5 and Mythos 5, and other models are
  unchecked. Remove such instructions and read summarized `thinking` blocks
  (`display: "summarized"`) instead.
- **Forced tool use**, `tool_choice` of `any` or `tool`, returns 400 on Opus 5.5 and
  Fable 5.1. The pages list it as a breaking change from Opus 5, and other models are
  unchecked. Replace it with `auto` plus strict tool use or structured outputs, and
  say in the prompt when the tool applies.

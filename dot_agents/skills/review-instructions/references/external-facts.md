# Probed Facts Behind Instruction Artifacts

What this machine's Claude Code harness and Anthropic's models were observed to do,
each entry with the check that verified it and the trigger that re-verifies it. A fact
about any other tool lives with the rules that rest on it, not here.

A claim about the harness or the models that this file does not list is unaudited.
Treat it as a mechanism argument and never cite it as measured. Cite an entry as
`references/external-facts.md` §<heading>.

Record an entry only with a check you ran in the recording session, and re-check a
claim inherited from a report or from memory before it enters. Query the `prompts`
wiki for claims from papers and vendor documentation, since a page there carries the
source's own words and its evidence block.

## Harness mechanics

Read from the live memory, skills, sub-agents, settings, hooks, and workflows
references at code.claude.com, last full pass on CLI 2.1.222. **Re-verify on each
Claude Code or model release, and the launch-flag fact on a desktop app release
too.** Facts marked *(probe)* are local observations rather than documentation, and
re-verify the same way.

Load limits and delivery:

- `MEMORY.md`: first 200 lines or 25KB, whichever comes first; content past the cap is
  silently dropped. Frontmatter and block-level HTML comments are stripped before
  measuring (v2.1.211+).
- A memory write past 80% of either `MEMORY.md` cap injects a compaction instruction
  through an internal `PostToolUse` callback, naming 70% of that cap as the target and
  prescribing one line per entry with the detail moved into the topic files. A per-note
  size cap exists in the same code and did not fire on a 47KB note, so its value is
  unestablished *(bundle read plus write probe, CLI 2.1.247)*.
- Skill listing: 1,536 characters per entry (`skillListingMaxDescChars`); the listing
  overall gets 1% of the context window (`skillListingBudgetFraction`, or
  `SLASH_COMMAND_TOOL_CHAR_BUDGET` for a fixed count).
- `@path` imports in `CLAUDE.md`: maximum depth 4; imported files expand at launch and
  buy back no context.
- `CLAUDE.md` is delivered as a user message after the system prompt and loads in full up
  to 4 MiB; a larger file is skipped entirely *(memory reference, CLI 2.1.238)*. The
  200-line target is a recommendation, not a cap.
- `CLAUDE.md`/`AGENTS.md` reach every subagent except the built-in Explore and Plan.
- Discovered `CLAUDE.md` files are concatenated, not overridden, loaded managed
  policy → user → project → local, so a project file does not supersede the user file
  and a cross-level contradiction stays live in context.
- Nested `CLAUDE.md` files load on demand when files in their directory are read, not
  at launch.
- `.claude/rules/`: every `.md` file under it loads at launch, subdirectories and
  symlink targets included, at `.claude/CLAUDE.md` priority. A rule with `paths:`
  frontmatter instead triggers on matching reads and is not re-injected after
  compaction. Whether a no-`paths` rule survives compaction is unrecorded: do not
  assert it either way. Linking `~/.agents/rulebook` there as `~/.claude/rules` put
  its 85 files into every session, 108k input tokens at launch against 18k without
  the link, so the harness link is named `rulebook` *(probe, 2.1.260, `claude -p`
  usage before and after)*. Re-check on a Claude Code release that changes rule
  loading.
- Re-invoking an unchanged skill re-delivers the whole body. The second invocation
  carries a header saying the instructions were previously loaded, then the full text
  follows it *(probe, 2.1.260)*. Compaction
  re-attaches each skill's most recent invocation, first 5,000 tokens, under a combined
  25,000-token budget.
- The `Read` tool re-delivers full file content on every call, including a second read
  of a file unchanged since the first. No dedupe, no already-loaded note *(probe,
  2.1.260: read a file, read it again unchanged, and read it again after editing it on
  disk; all three returned the file in full, the third with the new content)*. A rule
  that tells a session to reopen a file therefore delivers the words rather than a
  pointer.
- A skill description's own trigger does not load the skill. Four fresh `claude -p`
  sessions ran a build or a shaping with "use it when a task's work is finished and
  before anything is called done" in the listing and none invoked it. A closing line
  in the body of the skill the session was running did, five of five *(probe,
  2.1.261, DOT-59)*. A session reads the skill it is running and the global read
  table, and reaches on-demand material by `Read` on its path as often as by the
  `Skill` tool. Given "the review skill" and a code change, it opened the code
  reviewer's file by name and skipped the router, three of three. Re-check on a
  model release.
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
- Deterministic subagent caps: `CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH` and
  `CLAUDE_CODE_MAX_CONCURRENT_SUBAGENTS` (CLI 2.1.217+; SDK `max_budget_usd`). Claude
  Code adds its own delegation instruction only under the `claude_code` system-prompt
  preset.
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
- A `Stop` hook that blocks with exit 2 appends its stderr as a user message and the
  session writes a second assistant message. The first message stays in the transcript
  and on screen, and no `Stop` output field in the hooks reference edits, hides, or
  removes it, so a rewrite driven from `Stop` doubles the reply instead of replacing it
  *(probe, 2.1.278, one live desktop turn and one headless turn)*. Re-check on a
  Claude Code release, against the hooks reference's `Stop` output fields.
- `claude -p --output-format json` puts only the final assistant message in `result`,
  so a measurement that reads `result` cannot see an earlier message the same turn
  left in the transcript *(probe, 2.1.278, the headless turn above)*. Measure a
  turn's visible reply from the transcript's assistant text records. Rehearse reads
  this same field, so its verdict is over the last message and not over everything
  the reader saw *(read 2026-09-22 in its `session-attempt.ts`)*. Re-check on a
  Claude Code release.
- Workflow-spawned subagents run in `acceptEdits` and inherit the session's tool
  allowlist regardless of permission mode.
- `Agent` tool `name`: a named spawn has returned only a receipt in place of its report
  *(probe, 2.1.220–2.1.221)*. Two explanations remain open: an agent-team teammate
  mechanism, or an ordinary named background spawn; and the probes run so far cannot
  separate them. Do not restore either as settled.
- A custom output style registers under its frontmatter `name` when that field is
  present and under its filename otherwise, and `--settings '{"outputStyle":"<x>"}'`
  with a name no file registers loads no style at all, silently. Which file wins when
  two share a `name` is unrecorded, so do not assert it either way *(probe, 2.1.278: a
  variant file carrying `name: brief` was invisible under its own filename and the
  run landed with no output style, and with the `name` line removed all three models
  named the variant and quoted a sentence that exists only in it)*. Re-check on a
  Claude Code release, with a quote probe whose sentence the live style lacks.
- `claude -p --resume <id>` appends the new turn to the resumed transcript, so a second
  replay of the same fork sees the first replay's prompt and reply. `--fork-session`
  leaves the fork untouched and writes the continuation to a new session id, named by
  the `session_id` field of the `--output-format json` result *(probe, 2.1.278: every
  run without the flag returned the fork's own id and the forks filled with injected
  prompts, and every run with it returned a new id and left the forks at zero)*.
  Re-check on a Claude Code release.
- Session effort levels are `low`, `medium`, `high`, `xhigh`, and `max`, set for a
  session by `--effort` *(probe: `claude --effort bogus` names the valid set in its
  warning, 2.1.260)*.
- Agent-definition frontmatter takes `model` as one of the aliases `sonnet`, `opus`,
  `haiku`, `fable`, a full model id, or `inherit`, and `effort` as the session levels
  above *(model alias probed 2026-09-14 on 2.1.270: the screener definition pinned
  `model: opus` ran on `claude-opus-5`, read from its transcript, only when the call
  also passed the model; a definition created in a session is spawnable in that
  session, but a change to its model or body after that kept the first-loaded text
  and model for later spawns, so an edit to a definition is verified only from a
  fresh session. Effort is unprobed, since the transcript does not record it.
  Re-check model selection and definition reload behavior from a fresh session
  after a Claude Code release. Verify effort separately through runtime evidence
  that records it)*.

Mirror mark: where a rule elsewhere in the corpus rests on a fact above, the two are
edited together. The live copies are the kaizen skill's transcript layout, the relay
skill's transcript pointer, the relay and prompt skills' lists of effort levels, the
advisor and screener agent definitions' model and effort pins, the reviewer,
reviewer-medium, and reviewer-low definitions' effort pins, the
hard line in your always-loaded instructions that hooks and settings take effect
mid-session, the review-instructions skill's rule under Prefer enforcement to
prose against proposing a Stop hook that rewrites the reply, and its rule under the
behavioral-change evidence to run the comparison through rehearse.

## Writing a person into instruction files

Measured 2026-09-07 on Claude Code 2.1.263, Sonnet 5 and Opus 5, with the corpus's
own name in the named arms. **Re-verify on a Claude Code release and on a model
release.** Each bullet names the probe to rebuild.

- **No design has separated a named corpus from an unnamed one on what a session
  does.** Three probes, each an A/B over corpora identical but for the person:
  every person reference stripped from the always-loaded file, 3 task scenarios by 8
  reps by 2 arms, no difference in acting, asking or pushing back. A project rule
  attributed as "Ruled by <name>, <date>:" against the same rule and reason
  unattributed, 3 scenarios by 10 reps by 2 arms on a compiling Go fixture,
  byte-identical outcomes in the edited files. An instruction to override a rule the
  file credits to that person, 10 reps by 2 arms on each model, refused in every
  run. The last two sat at ceiling, where no design of that size separates anything,
  so they bound nothing. Treat this as three nulls and not as an established
  absence. *(probe)*
- **None of 80 transcripts cited the person a rule was attributed to.** Their
  project rules read "Ruled by <name>, <date>:" and every justification quoted the
  rule's stated reason instead. The corpus's own live form is `Ruled (<name>,
  <date>):`, which was not the string probed. *(probe)*
- **A name in a skill description does not measurably change whether the skill
  fires.** Named against generic: 12/15 and 10/15 on Sonnet with two synthetic
  skills, 15/15 and 14/15 on Opus with the same pair, and 17/24 and 15/24 with the
  real corpus swapped through `~/.agents`. Firing means the session invoked the
  Skill tool for the skill the prompt was written for. Pooled 44/54 against 39/54,
  two-tailed Fisher p = 0.36. Every pair leaned to the named form, by 13, 7 and 8
  points. At 54 per arm a two-sided test at 80% power resolves only a 20-point gap,
  and separating the 9-point gap observed would take 322 per arm, so an effect that
  size stands unexcluded. This measures model invocation, so it says nothing about a
  skill carrying `disable-model-invocation`, whose description a person reads rather
  than the model matching it. *(probe)*
- **A description phrased around a request arriving does not fire on a request
  phrased as an observation.** "Use when asked to deploy" and "Use when <name> asks
  to deploy" both fired 0/10 on "this release has been sitting for a week", on
  Sonnet and on Opus, while both fired near ceiling on "ship the new build to
  production". *(probe)*

## What a rule's own wording fails to carry

Measured 2026-09-07 on Claude Code 2.1.263, Sonnet 5 and Opus 5. **Re-verify on a
Claude Code release and on a model release.**

- **No rule rewrite probed here has moved the outcome it targeted.** Six designs on
  Sonnet 5, two of them also on Opus 5: four corpus lines against a vague directive,
  one rewrite of the find-the-box rule, and one hardening of the review checks. No
  control was run for the review-check design, so its numbers are withheld here per
  the rule requiring one. One rewrite moved
  something other than its target, taking a wrong guess from 12 of 16 to 0 of 16 while
  leaving the fix rate flat. A seventh design on the rule shape that drew the demand in
  a real review is void: its fixture did not apply, three of its ten runs said so, and
  the surviving runs tie at 2 of 5. Rebuild it with a fixture that applies and a
  control before citing anything from it. Nothing here licenses skipping a probe, and
  it bounds only what one can settle. *(probe)*
- **Whether a vague directive stops a session is a model property, and no line
  tested moved either model.** Opus 5 acted on it and Sonnet 5 did not, so measure
  this again on any model the corpus is run on rather than carrying either number
  forward. On "the sync is too slow, fix it" in a directory holding a Go fixture
  whose `Sync` loads records one at a time over a real 80ms call, Opus changed the
  code in 31 of 32 sessions and every change compiled. Sonnet changed it in 3 of 64.
  Sessions ran under a 12-turn cap that truncated 11 of the 43 Opus runs, so 16 is
  the cap and not an observed ceiling. The one Opus miss spent its turns reading the
  rulebook and probing, and never started editing. On the vague directive Opus made 6
  to 16 tool calls per session and 0 of 10 Sonnet sessions made any. Two lines were
  tested on both models, the live corpus and the scope-growth trigger dropped from
  Acting, and neither separated: Opus 16 and 15 of 16, at ceiling and able to
  separate nothing downward, Sonnet 1 and 1 of 16. Two more were tested on Sonnet
  alone, the debug description narrowed to a cause surviving a direct look and the
  chezmoi machine description dropped, at 0 and 1 of 16. Dropping the chezmoi line
  took the wrong guess from 12 of 16 to 0 of 16 and left the fix rate flat, so that
  line steers what a session guesses and not whether it looks. *(probe)*
- **Whether a session checks that a rule's stated reason fits is unmeasured.** The
  probe set a five-attempt retry budget whose written reason is that past five the
  caller's deadline has expired, then gave a caller with a ten-minute deadline and
  one-second attempts. Its fixture did not compile, the same flaw that voided the
  vague-directive number measured beside it, so its numbers are withdrawn. Judgment
  displacement stays in the skill's Known failure modes as a shape to watch for.
  Re-probe on a compiling fixture before citing anything here. *(probe withdrawn)*

- **A shorter brief style file ran shorter replies on Opus 5, 2026-09-08, the landed
  file by 7 and 13 percent on the two turns it ran, and at three runs per cell the
  short variants do not separate from each other or, on two turns, from the old
  file.** doc-4 fork-replay,
  `--model opus --effort high`, Claude Code 2.1.263, three live turns that drew /brief,
  three runs per cell. Means, old 225-line file against 76-line and 42-line files: 240
  against 228 and 197; 223 against 211 and 185; 617 against 502 and 472. The 42-line
  file plus the em dash line gave 224 and 504, inside the spread, and moved no em dash
  count. The 49-line file that landed gave 210 and 206. This reverses decision-1's
  record, whose short variants were a 140-word template and a 276-word reduction, both
  outside the register. Every cell stays 1.4 to 3.8 times the kept length. Re-measure
  on a model swap and before any further edit to the file, with the same harness.
  *(probe, decision-2 and doc-18 on the board)*

- **The /brief skill at 100 body words rewrites a turn to the same length as at 140,
  and dropping its "CEO who has thirty seconds" clause lengthens the rewrite.** Opus 5,
  2026-09-08, doc-4 fork-replay cut at the /brief message, variant body as the prompt,
  three live turns whose kept rewrites were 126, 140, and 132 words. Means, old body
  against the landed one: 154 against 114, 128 against 138, 144 not run. The same
  body without the CEO clause: 157, 155, 174, the longest arm on every turn. A
  restructured body asking for "one plain sentence each" gave 128, 132, 151 and still
  produced labeled lines in 3 of 9 runs, against 1 of 6 for the landed body. Every arm
  lands inside 30 words of the kept length. Re-measure on a model swap and before any
  further edit, with the same harness. *(probe, doc-18 on the board)*

## Deprecated model mechanics

**Re-verify on each model release**, against the extended-thinking reference and the
newest model's prompting page at platform.claude.com. Last checked against the Opus 5.5
release pages (What's new, Prompting, and Migrating), fetched 2026-09-22. The Fable 5
and Mythos 5 claims, the prefill claim, and the tiers before Claude 4.7 rest on
Prompting Claude Fable 5 and Prompting best practices, fetched 2026-08-27. The old
prefill documentation path redirects and states none of these.

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
  refusal category, and the request then returns no model output. A prompt asking for
  the reasoning verbatim was declined this way on Opus 5.5 and on Opus 5, although the
  Opus 5.5 pages call the category new against Opus 5 *(probe on 2.1.280, one `claude
  -p` stream-json call per model with a prompt asking for its reasoning word for word,
  category read from `stop_details`)*. Re-run that probe on each model release, since
  the pages disagree with it. The vendor also names Fable 5 and Mythos 5, and other
  models are unchecked. Remove such instructions and read summarized `thinking` blocks
  (`display: "summarized"`) instead.
- **Forced tool use**, `tool_choice` of `any` or `tool`, returns 400 on Opus 5.5 and
  Fable 5.1. Opus 5 accepts it, and other models are unchecked. Replace it with `auto`
  plus strict tool use or structured outputs, and say in the prompt when the tool
  applies.

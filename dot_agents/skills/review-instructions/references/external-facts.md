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
references at code.claude.com, with the model-config, CLI, and SDK pages, last full
pass on CLI 2.1.280 on 2026-09-23. **Re-verify on each Claude Code or model release,
and the launch-flag fact on a desktop app release too.** Facts marked *(probe)* are
local observations rather than documentation, and re-verify the same way. A
*(DOT-101: name)* tag marks a 2026-09-23 re-check on CLI 2.1.280, on
`claude-opus-5-5` unless the entry names another model, one `claude -p` session per
name, whose command, stream, transcript, and the reference pages read are under
`~/code/backlog/boards/dotfiles/evidence/DOT-101/`.

Load limits and delivery:

- `MEMORY.md`: first 200 lines or 25KB, whichever comes first; content past the cap is
  silently dropped. Frontmatter and block-level HTML comments are stripped before
  measuring (v2.1.211+), a clause the 2.1.280 memory reference no longer states.
- A memory write past 80% of either `MEMORY.md` cap injects a compaction instruction
  through an internal `PostToolUse` callback, naming 70% of that cap as the target and
  prescribing one line per entry with the detail moved into the topic files. A per-note
  size cap exists in the same code and did not fire on a 47KB note, so its value is
  unestablished *(bundle read plus write probe, CLI 2.1.247)*. The 2.1.280 memory
  reference documents the reminder near a limit and an error past one without naming
  either threshold. The 80% and 70% figures came from reading the CLI bundle and were
  not re-read on 2.1.280.
- Skill listing: 1,536 characters per entry (`skillListingMaxDescChars`); the listing
  overall gets 1% of the context window (`skillListingBudgetFraction`, or
  `SLASH_COMMAND_TOOL_CHAR_BUDGET` for a fixed count).
- `@path` imports in `CLAUDE.md`: maximum depth 4; imported files expand at launch and
  buy back no context.
- `CLAUDE.md` is delivered as a user message after the system prompt and loads in full up
  to 4 MiB; a larger file is skipped entirely *(memory reference, CLI 2.1.238)*. The
  200-line target is a recommendation, not a cap.
- `CLAUDE.md`/`AGENTS.md` reach every subagent except the built-in Explore and Plan and
  a custom subagent whose definition sets `omitClaudeMd: true`, which still gets managed
  policy files.
- Discovered `CLAUDE.md` files are concatenated, not overridden, loaded managed
  policy → user → project → local, so a project file does not supersede the user file
  and a cross-level contradiction stays live in context.
- Nested `CLAUDE.md` files load on demand when files in their directory are read, not
  at launch.
- `.claude/rules/`: every `.md` file under it loads at launch, subdirectories and
  symlink targets included except the project case below, at `.claude/CLAUDE.md`
  priority. A rule with `paths:` frontmatter instead triggers on matching reads and is
  not re-injected after
  compaction. Whether a no-`paths` rule survives compaction is unrecorded: do not
  assert it either way. Linking `~/.agents/rulebook` there as `~/.claude/rules` put
  its 88 files into every session, 124,085 input tokens at launch against 2,007
  without the link, so the harness link is named `rulebook` *(DOT-101: home-rules,
  home-baseline, each with `HOME` pointed at a copy of `~/.claude` holding a one-line
  `CLAUDE.md`)*. A project `.claude/rules` linked to a directory outside the working
  directory loaded nothing, while a real directory there loaded *(DOT-101:
  rules-link, rules-real)*. The memory reference treats such a link as an external
  import that loads only after approval, and asks for that approval only for an
  `@path` import, never for a link alone. Re-check on a Claude Code release that
  changes rule loading.
- Re-invoking a skill whose rendered content is unchanged returns "Skill /<name> is
  already loaded above; instructions unchanged." with no body. After the file changed,
  the full new body came back under a header saying the instructions were previously
  loaded *(DOT-101: skill-redelivery, skill-changed)*, and the skills reference says
  changed arguments or new dynamic output re-deliver it too. Compaction re-attaches
  each skill's most recent invocation, first 5,000 tokens, under a combined
  25,000-token budget, and the reference says a re-invocation after compaction
  restores the full content.
- The `Read` tool re-delivers full file content on every call, including a second read
  of a file unchanged since the first. No dedupe, no already-loaded note *(DOT-101:
  read-redelivery, which read a file, read it again unchanged, and read it again after
  editing it on disk, and all three returned the file in full, the third with the
  new content)*. A rule that tells a session to reopen a file therefore delivers the
  words rather than a pointer.
- A skill description's own trigger did not load the skill on Sonnet 5. Four fresh
  `claude -p` sessions ran a build or a shaping with "use it when a task's work is
  finished and before anything is called done" in the listing and none invoked it,
  while a closing line in the body of the skill the session was running did, five of
  five *(probe, `claude-sonnet-5` on 2.1.261, DOT-59)*. On Opus 5.5, launched at
  `--effort high`, the review ran in each of the five sessions that reached that line:
  two code builds, a code and skill-file build, a shaping *(DOT-101: fire-code-2,
  fire-code-3, fire-mixed-2, fire-shape-2)*, and a code build that could not read the
  board rules and gave the build skill's next step as its reason *(DOT-101:
  fire-code-1)*. With the closing line cut from the build skill, both code builds still
  ran the review before Done, one quoting the board rules' "every change takes review"
  and one moving the card to Review "per the board rules" *(DOT-101: nolines-code-1,
  nolines-code-2)*, so the description alone is unmeasured on Opus 5.5. A build whose
  only change was a skill file stopped before the closing line, at review-instructions'
  evidence gate, which needs `claude` runs the probe's permissions refused *(DOT-101:
  fire-skill-2)*. Every Opus 5.5 session that ran the review invoked the router with
  the `Skill` tool and then the skill it routed to, seven of seven, while DOT-59's code
  builds went straight to the code reviewer's skill, three of three. The corpus
  changed between the two runs, so the model is not the only difference. The delivery
  skill, which the global read table names by path, was opened with `Read` in all
  seven builds that used it *(DOT-101: fire-code-2, fire-code-3, fire-mixed-1,
  fire-mixed-2, fire-skill-1, nolines-code-1, nolines-code-2)*. review-instructions,
  which the table names by path and a hard line names as a skill, was invoked with the
  `Skill` tool in all four builds that used it *(DOT-101: fire-mixed-1, fire-mixed-2,
  fire-skill-1, fire-skill-2)*. Re-check on a model release, with the board rules'
  review sentence also cut from the description-only arm.
- Auto memory is on by default, per-project, machine-local, and never loaded into a
  non-fork subagent.
- Session transcripts live at
  `${CLAUDE_CONFIG_DIR:-$HOME/.claude}/projects/<slug>/<session-id>.jsonl`, where
  `<slug>` is the cwd with `/`, `.`, spaces, and `~` collapsed to `-` *(DOT-101:
  init-listing turned `/private/tmp/dot101/a.b c` into `-private-tmp-dot101-a-b-c`,
  with `~` not exercised)*.
- `$CLAUDE_CODE_SESSION_ID` is set in Claude Code sessions, and a Bash tool call reads
  the same id the stream reports *(DOT-101: session-id)*.
- The desktop app launches the CLI with `--allow-dangerously-skip-permissions` and a
  `--permission-mode` flag. Eight live sessions carried `bypassPermissions` in seven
  and `auto` in one, while the user settings set `defaultMode` to `bypassPermissions`,
  so whether the flag follows that setting or a choice made per session is unsettled
  *(probe: `ps`, desktop app 2.7032.0, CLI 2.1.280, DOT-101 `runs/desktop-ps.txt`)*.

Tool, permission, and invocation fields:

- A skill's `allowed-tools` pre-approves for the invoking turn; it does not restrict.
  `disallowed-tools` restricts. Both lapse at the next user message, so neither is a
  durable boundary; treating either as one is a false boundary.
- `user-invocable: false` hides the skill from the `/` menu and ignores a typed
  `/name`, and the description stays in context.
  `disable-model-invocation: true` blocks programmatic invocation and removes the
  skill from the model's skill listing, while the stream's init record still lists
  it among skills and slash commands *(DOT-101: dmi)*.
- A skill's `context: fork` inherits no caller context: the opposite of a
  conversation fork, which inherits the entire conversation. The two share a word and
  invert the behavior.
- A background subagent keeps every MCP tool, `Agent` and `ExitPlanMode` under the
  conditions every subagent gets them, and only these other built-in tools: `Read`,
  `Grep`, `Glob`, `LSP`, `Bash`, `PowerShell`, `Edit`, `Write`, `NotebookEdit`,
  `WebFetch`, `WebSearch`, `TodoWrite`, `Skill`, `ToolSearch`, `EnterWorktree`,
  `ExitWorktree`, `Monitor`, `TaskStop`, `SendMessage`, `Artifact`, and
  `SubagentHandback` for a subagent that reports through it *(sub-agents reference)*.
  The narrowing subtracts from the `tools` field and never adds to it, and a `tools`
  list resolving to nothing usually fails the agent at launch.
- A sub-agent's `tools` restricts; `disallowedTools` subtracts from inherited or
  specified tools.
- Deterministic subagent caps: `CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH` and
  `CLAUDE_CODE_MAX_CONCURRENT_SUBAGENTS` (CLI 2.1.217+; SDK `max_budget_usd`). A
  session with ultracode active is exempt from the concurrency cap. The
  SDK's default system prompt covers tool calling only. Claude Code's own instructions
  arrive with the `claude_code` preset, which `claude -p` uses by default.
- Permission rules evaluate deny → ask → allow; the first match wins and specificity
  does not reorder, so a broad deny cannot carry allowlist exceptions. A bare tool name
  in `deny` removes the tool from context entirely; a scoped rule only blocks matching
  calls.
- `skillOverrides` has four states: `on`, `name-only`, `user-invocable-only`, `off`;
  absent means `on` *(DOT-101: override-name-only, override-user-invocable-only,
  override-off)*. Keys match the skill name, so two skills sharing a name share one
  entry, and a project skill named like a user skill is the only one listed
  *(DOT-101: samename-on, samename-off)*. It does not apply to plugin skills.
- Settings changes reload mid-session (documented for `permissions`, `hooks`,
  credential helpers). A hook script body also takes effect mid-session *(DOT-101:
  hook-body, where a `PostToolUse` script edited between two calls returned the new
  text on the next call)*.
- Hook reach is per event, not main-thread-only: tool events like `PreToolUse` and
  `PostToolUse` fire inside subagents too. Plain hook stdout becomes model-visible
  context only for `UserPromptSubmit`, `UserPromptExpansion`, and `SessionStart`,
  which subagents never fire, and for `PostModelSwitch`. A `PostToolUse` hook injects
  model-visible text through `hookSpecificOutput.additionalContext` instead *(DOT-101:
  hook-body)*, and the 2.1.280 hooks reference gives `PreToolUse` the same field,
  unprobed.
- A `Stop` hook that blocks with exit 2 appends its stderr as a user message and the
  session writes a second assistant message. The first message stays in the transcript
  and on screen, and no `Stop` output field in the hooks reference edits, hides, or
  removes it, so a rewrite driven from `Stop` doubles the reply instead of replacing it
  *(DOT-101: stop-hook)*. `Stop` also accepts `additionalContext`, which continues the
  turn the same way. A `MessageDisplay` hook's `displayContent` replaces text on screen
  only, and the transcript and what the model sees keep the original *(hooks
  reference, unprobed)*. Re-check on a Claude Code release, against the hooks
  reference's `Stop` and `MessageDisplay` output fields.
- `claude -p --output-format json` puts only the final assistant message in `result`,
  so a measurement that reads `result` cannot see an earlier message the same turn
  left in the transcript *(DOT-101: stop-hook, whose result held only the second
  message)*. Measure a turn's visible reply from the transcript's assistant text
  records. Rehearse reads
  this same field, so its verdict is over the last message and not over everything
  the reader saw *(read 2026-09-22 in its `session-attempt.ts`)*. Re-check on a
  Claude Code release.
- Workflow agents use the session's permission rules and get their permission mode
  by the rules for any subagent, and in `claude -p` the `Workflow` call itself goes
  through permission evaluation without a prompt *(workflows reference, unprobed,
  since `disableWorkflows` is on here)*.
- `Agent` tool `name`: a named spawn has returned only a receipt in place of its report
  *(probe, 2.1.220–2.1.221)*. Two explanations remain open: an agent-team teammate
  mechanism, or an ordinary named background spawn; and the probes run so far cannot
  separate them. Do not restore either as settled. Not re-run on 2.1.280, since no
  probe designed so far separates the two.
- A custom output style registers under its frontmatter `name` when that field is
  present and under its filename otherwise, and `--settings '{"outputStyle":"<x>"}'`
  with a name no file registers loads no style at all, silently. Which file wins when
  two share a `name` is unrecorded, so do not assert it either way *(DOT-101: with
  `name: brief`, style-named asked for the variant by filename and answered that it had
  no style, and with the `name` line removed style-plain quoted a sentence that exists
  only in the variant)*. The stream's init record names the requested style in both
  cases, so it does not show whether a style loaded. Re-check on a Claude Code
  release, with a quote probe whose
  sentence the live style lacks.
- `claude -p --resume <id>` appends the new turn to the resumed transcript, so a second
  replay of the same fork sees the first replay's prompt and reply. `--fork-session`
  leaves the fork untouched and writes the continuation to a new session id, named by
  the `session_id` field of the `--output-format json` result *(DOT-101: resume-plain,
  which resumed a fork, returned the fork's id, and grew it from 19 to 29 lines, and
  resume-fork, which returned a new id and left it at 29)*. Re-check on a Claude Code
  release.
- Session effort levels are `low`, `medium`, `high`, `xhigh`, and `max`, set for a
  session by `--effort` *(DOT-101: effort-bogus, whose warning names that set and says
  it uses the default)*. `--effort ultracode` is also accepted without a warning, and
  the CLI reference describes it as `xhigh` with workflow orchestration *(DOT-101:
  effort-ultracode-2)*. Opus 5.5 starts at `medium` unless the environment, a flag,
  `/effort`, or a per-model setting sets a level, and a top-level `effortLevel` in the
  user settings does not count for it. Other current models default to `high`
  *(model-config reference)*.
- Agent-definition frontmatter takes `model` as one of the aliases `sonnet`, `opus`,
  `haiku`, `fable`, a full model id, or `inherit`, and `effort` as the session levels
  above. The pins hold with no model passed. The screener, pinned `model: opus` and
  `effort: low`, ran on `claude-opus-5-5` from a `claude-sonnet-5` parent, the same as
  when the call passed `opus` *(DOT-101: alias-sonnet-nomodel, alias-sonnet-opus)*. A
  `PreToolUse` hook inside it read effort `low` in those runs and under a
  `claude-opus-5-5` parent, while each parent ran at `high` or `xhigh` *(DOT-101:
  alias-opus-nomodel, the model read from the subagent transcript and the effort from
  the hook input's `effort` field)*. A call passing a model other than the pin was not
  run, and the sub-agents reference ranks the call's model above the definition's. The
  advisor, pinned `fable`, ran on `claude-fable-5-1` *(DOT-101: fire-shape-1)*. In
  `claude -p` at `medium` effort, a definition a Bash script wrote during the session
  was still unknown to the `Agent` tool 20 seconds later, and one it rewrote kept its
  first-loaded model and body, while a fresh session spawned the rewrite *(DOT-101:
  reload-insession, reload-slow, reload-edit, reload-fresh)*. The sub-agents reference
  says the next spawn picks up an edit within seconds, which these runs did not show,
  so verify an edit to a definition from a fresh session. Re-check on a Claude Code
  release, from fresh sessions.

Mirror mark: where a rule elsewhere in the corpus rests on a fact above, the two are
edited together. The live copies are the always-loaded rule to read a rule file
again each time the work returns to it, which rests on the `Read` entry, the relay
skill's transcript pointer, the relay and prompt skills' lists of effort levels, the
advisor and screener agent definitions' model and effort pins, the reviewer,
reviewer-medium, and reviewer-low definitions' effort pins, the
hard line in your always-loaded instructions that hooks and settings take effect
mid-session, the review-instructions skill's rule under Prefer enforcement to
prose against proposing a Stop hook that rewrites the reply, and its rule under the
behavioral-change evidence to run the comparison through rehearse.

## Writing a person into instruction files

Measured 2026-09-07 on Claude Code 2.1.263, Sonnet 5 and Opus 5, with the corpus's
own name in the named arms and no effort flag passed. Re-checked 2026-09-23 on Claude
Code 2.1.280 and `claude-opus-5-5` at `--effort high`, on the 2026-09-07 fixtures
rebuilt from the session that ran them and the commit it read. The re-check ran in
acceptEdits with reads of the corpus granted and no command granted that runs code.
The 2026-09-07 firing probes had bypassed permissions, and on neither date did a
session run a go command. Each date ran on the corpus live that day, so a difference
between dates can come from the model, the harness, or the corpus. The re-check's
commands, streams, transcripts, scores, and fixtures are the `c4-*` runs under
`~/code/backlog/boards/dotfiles/evidence/DOT-101/`, beside the 2026-09-07 transcripts
and a rescore of them by the same rules. **Re-verify on a Claude Code release and on
a model release.**

- **On Opus 5.5 one of three designs separated a rule credited to a person from the
  same rule uncredited.** Each probe is an A/B over corpora identical but for the
  person, and each pair of counts gives the arm with the person first. Told to "drop
  the retry budget to 1" in a file whose only retry code is a TODO pointing at a
  project rule of five attempts, sessions whose rule read "Ruled by <name>, <date>:"
  left the file untouched in 8 of 10. Sessions given the same rule and reason
  unattributed rewrote or deleted the TODO in 10 of 10, two-tailed Fisher p = 0.0007.
  Every edit was to that comment, so neither arm changed what the code does. Five of
  the ten attributed replies took the rule for the requester's own ("your 2026-08-14
  ruling"), so the split may turn on the author reading as the person typing, which a
  name other than the machine owner's would test. Stripping every person reference
  from the always-loaded file did not separate, over 3 task scenarios by 8 runs by 2
  arms. "Make the error handling consistent" changed the code in 8 and 7 of 8, "the
  sync is too slow, fix it" in 0 and 1, a false claim that the retry loop never stops
  drew pushback in 8 of 8 each, and replies ended on a question in 7 and 2 of 24, p =
  0.14. The attributed project rule against the unattributed one, on a compiling Go
  fixture, sat at ceiling: 5 of 5 each added a zero-value check to a function whose
  argument type has a validating constructor, 5 of 5 each validated a raw webhook
  address, and 10 of 10 each wired five attempts. On 2026-09-07 no design separated,
  on Sonnet 5 for all three or on Opus 5 for the override. There Sonnet 5 added the
  zero-value check in 0 of 10 each, validated the address in 3 and 5 of 10, and wired
  five in 3 and 4 of 10, and Opus 5 wrote a budget of 1 in 1 and 3 of 10. Treat the
  split as one design on one model and the rest as nulls, not as an established
  absence. *(probe, DOT-101: c4-override-*, c4-stripped-*, c4-attr-*)*
- **A session given a rule credited to a person sometimes names that person as its
  authority.** On Opus 5.5, 10 of 30 sessions whose project rules read "Ruled by
  <name>, <date>:" named the person in their reply, as the source of the number ("the
  limit <name> set on 2026-08-14") or as who decides a change ("<name> should rule on
  that"). Every one of those replies weighed the caller's deadline, and 8 tied it to
  the rule's stated reason. None of the 30 sessions given the unattributed rule named
  the person. On 2026-09-07, counted the same way, Sonnet 5 named the person in 1 of
  80 transcripts of a first attribution design, routing a question to them. Told to
  skip the rule's validation, 4 of 10 attributed sessions named the person and 0 of 10
  unattributed, 3 of the 4 giving the person as the reason ("The rule <name> set
  requires..."). One Opus 5 session wrote a date the rule never gave into a code
  comment crediting the person. The count covers the one name in visible text and in
  the thinking that was readable. Commit `256263b9` removed the corpus's last `Ruled
  (<name>, <date>):` form, and no live corpus file attributes a rule to a person.
  *(probe, DOT-101: c4-attr-A-*, c4-override-A-*)*
- **A name in a skill description does not measurably change whether the skill
  fires.** Named against generic, two synthetic skills on direct requests fired 15/15
  and 15/15 on Opus 5.5, 15/15 and 14/15 on Opus 5, and 12/15 and 10/15 on Sonnet 5.
  With the real corpus swapped through `~/.agents`, Sonnet 5 fired 17/24 and 15/24.
  Firing means the session invoked the Skill tool for the skill the prompt was written
  for. The 2026-09-07 runs pooled 44/54 against 39/54, two-tailed Fisher p = 0.36,
  every pair leaning to the named form by 13, 7 and 8 points. At 54 per arm a
  two-sided test at 80% power resolves only a 20-point gap, and separating the
  9-point gap observed would take 322 per arm, so an effect that size stands
  unexcluded. Opus 5.5 fired both forms on every direct request, so its runs can
  separate nothing. The real-corpus arm was not re-run, because it swapped the live
  `~/.agents` and its unnamed arm was a working tree mid-edit that no commit holds.
  This measures model invocation, so it says nothing about a skill carrying
  `disable-model-invocation`, whose description a person reads rather than the model
  matching it. *(probe, DOT-101: c4-firing-*)*
- **A description phrased around a request arriving does not fire on a request
  phrased as an observation.** "Use when asked to deploy" and "Use when <name> asks
  to deploy" each fired 0 of 5 on "this release has been sitting for a week" on Sonnet
  5, Opus 5, and Opus 5.5. The matching schema-migration pair fired 0 of 5 each on
  "the schema looks wrong here, take a look". On "ship the new build to production"
  both deploy descriptions fired 5 of 5 on Opus 5 and Opus 5.5 and 3 of 5 on Sonnet 5.
  *(probe, DOT-101: c4-firing-*-g1-*, c4-firing-*-g2-*, c4-firing-*-p1-*)*

## What a rule's own wording fails to carry

Measured 2026-09-07 on Claude Code 2.1.263, Sonnet 5 and Opus 5. The vague-directive
bullet was re-checked on 2026-09-23 on Claude Code 2.1.280 and `claude-opus-5-5`, and
the rewrite bullet says why none of its designs was re-run. The re-check's commands,
streams, transcripts, scores, and fixture are under
`~/code/backlog/boards/dotfiles/evidence/DOT-101/`, beside the 2026-09-07 transcripts
and the fixture recovered from them. **Re-verify on a Claude Code release and on a
model release.**

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
  it bounds only what one can settle. *(probe)* None of these designs was re-run on
  Opus 5.5. The three edited corpus lines were tested as causes of a session
  stopping, and no Opus 5.5 session stopped on the live corpus (the next bullet), so
  they have nothing to move. The chezmoi line's wrong guess was a session's output
  naming chezmoi, and no Opus 5.5 session on the live corpus named it anywhere in its
  text or thinking, so that effect has nothing to move either. Commit `30645173` names
  the find-the-box and review-check fixtures in a phrase each and records no prompt.
  Their 2026-09-07 transcripts are kept under the same evidence root, and whether a
  complete fixture can be rebuilt from them is unchecked.
- **Whether a vague directive stops a session is a model property, and no line
  tested moved either model.** Opus 5 acted on it and Sonnet 5 did not, so measure
  this again on any model the corpus is run on rather than carrying either number
  forward. On "the sync is too slow, fix it" in a directory holding a Go fixture
  whose `Sync` loads records one at a time over a real 80ms call, Opus 5 changed the
  code in 31 of 32 sessions and every change compiled. Sonnet 5 changed it in 3 of 64.
  Sessions ran under a 12-turn cap that truncated 11 of the 43 Opus 5 runs, so 16 is
  the cap and not an observed ceiling. The one Opus 5 miss spent its turns reading the
  rulebook and probing, and never started editing. On the vague directive Opus 5 made
  6 to 16 tool calls per session and 0 of 10 Sonnet 5 sessions made any. Two lines were
  tested on both models, the live corpus and the scope-growth trigger dropped from
  Acting, and neither separated: Opus 5 at 16 and 15 of 16, at ceiling and able to
  separate nothing downward, Sonnet 5 at 1 and 1 of 16. Two more were tested on Sonnet 5
  alone, the debug description narrowed to a cause surviving a direct look and the
  chezmoi machine description dropped, at 0 and 1 of 16. Dropping the chezmoi line
  took the wrong guess from 12 of 16 to 0 of 16 and left the fix rate flat, so that
  line steers what a session guesses and not whether it looks. *(probe)* An Opus 5.5
  re-check ran on a fixture rebuilt to the same description, with a test, a command
  that times a 50-record sync at 4.09s, and a git repository, none of which the
  2026-09-07 fixture had. That one also had four record loaders, a retry helper, and a
  comment in `Sync` saying a README calls it fast enough, though no README exists.
  Counted as the 2026-09-07 runs were, by a change to a source file other than a
  test, Opus 5.5 changed the code in 14 of 16 sessions on the live corpus, and the
  other 2 had changed only the test file. The 12-turn cap ended all 16 while they
  were still working, so none stopped to ask and none was seen finishing.
  All 14 changes compiled and cut that sync to between 0.08s and 0.41s, though one
  still dropped upstream errors. Each session made 15 to 28 tool calls and invoked the
  debug skill. The Opus 5 runs bypassed permissions and passed no effort flag. These
  used acceptEdits with named grants, which refused 2 to 4 commands per session, at
  `--effort high`. *(probe, DOT-101: r3-live-01 to r3-live-16)*
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

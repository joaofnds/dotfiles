# Probed Facts Behind Instruction Artifacts

What this machine's harness and tools were observed to do, each entry with the check
that verified it and the trigger that re-verifies it.

A numeric or outcome claim an instruction artifact makes that is not listed here is
unaudited. Treat it as a mechanism argument and never cite it as measured. Cite an entry as `references/external-facts.md` §<heading>.

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
- `.claude/rules/`: a rule without `paths:` frontmatter loads at launch at
  `.claude/CLAUDE.md` priority; with `paths:` it triggers on matching reads and is not
  re-injected after compaction. Whether a no-`paths` rule survives compaction is
  unrecorded: do not assert it either way.
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
- Workflow-spawned subagents run in `acceptEdits` and inherit the session's tool
  allowlist regardless of permission mode.
- `Agent` tool `name`: a named spawn has returned only a receipt in place of its report
  *(probe, 2.1.220–2.1.221)*. Two explanations remain open: an agent-team teammate
  mechanism, or an ordinary named background spawn; and the probes run so far cannot
  separate them. Do not restore either as settled.
- Session effort levels are `low`, `medium`, `high`, `xhigh`, and `max`, set for a
  session by `--effort` *(probe: `claude --effort bogus` names the valid set in its
  warning, 2.1.260)*.

Mirror mark: where a rule elsewhere in the corpus rests on a fact above, the two are
edited together. The live copies are the kaizen skill's transcript layout, the relay
skill's transcript pointer, the relay and prompt skills' lists of effort levels, and the
hard line in your always-loaded instructions that hooks and settings take effect
mid-session.

## backlog.md CLI

Probes against backlog.md v1.50.1 at `/opt/homebrew/bin/backlog`, with the
directory bullets re-probed at v1.51.0. The final bullet is a git probe with its
own trigger. **Re-verify on any backlog.md upgrade.**

- `backlog init` writes a `<CRITICAL_INSTRUCTION>` workflow block into the repo's
  `AGENTS.md`. A hand-rolled board (the board's `{tasks,docs}` plus a config file)
  is fully functional without init.
- Transitions are ungated: the CLI silently accepts `-s Done` with unchecked
  acceptance criteria, forward moves while a dependency is open, and nonexistent
  `--ref`/`--doc` paths.
- A root `backlog.config.yml` with a `backlog_directory` key moves the whole board,
  docs and decisions included, to that path, and the CLI finds it from any
  subdirectory. The same key inside the board's own `config.yml` is ignored, leaving
  the board at `backlog/` *(probe, 1.51.0)*.
- `backlog init --backlog-dir` with a custom path defaults the config to the root and
  refuses `--config-location folder`. It also refuses `--agent-instructions none`
  combined with `--integration-mode none` *(probe, 1.51.0)*.
- `backlog doc create` rejects paths outside the board's `docs/` directory.
- `backlog milestone` is a first-class object with `add`, `list`, `rename`, `remove`,
  and `archive`, and a board holds any number of them. A milestone carries an optional
  description and due date, and `task create -m` and `task list -m` assign and filter by
  closest case-insensitive title match *(probe, 1.51.0)*.
- A milestone's completion is derived from the tasks assigned to it, so it leaves the
  active set of `milestone list` once every one of them is Done. A milestone with no
  tasks stays active at `0/0 done` *(probe, 1.51.0)*.
- `--append-notes`, `--append-plan`, and `--append-final-summary` accumulate within a
  call and across calls, and `--comment` appends a discussion comment.
  `task list --plain` lists every column, Done included. `decision create` fails with
  ENOENT when the board has no `decisions/` directory *(probe, 1.51.0)*.
- `task edit --notes` replaces the whole implementation-notes field, `--append-notes`
  appends; `--doc` and `--dep` likewise replace the whole field and have no additive
  sibling, so a second call drops the first call's values; `task create` without `-s`
  lands the card in `default_status`, `--parent` included *(probe, 1.50.1)*.
- A doc file without the four-key frontmatter (id, title, type, created_date) lists
  as a blank-titled row.
- Doc and task IDs allocate max+1, so hand-assigned IDs are safe.
- No global or user-level config exists; `backlog config` is project-scoped.
- The CLI re-serializes the board's config file during read operations (checksum and
  line count change on a `task list`). Raw-edited values of known keys survived
  re-serialization in fresh-board probes, but one live-board raw edit
  (`zero_padded_ids`) was later found reverted, cause unpinned: prefer
  `backlog config set`, and re-verify the file after a subsequent `task list`.
- `backlog task <id> --json` wraps output as `{schemaVersion: 1, kind, task:{...}}`;
  the card fields (`title`, `description`, `status`, `labels`, `dependencies`,
  `acceptanceCriteria[].checked`, `subtasks`, `documentation`, `implementationNotes`,
  `finalSummary`, `parentTaskId`) sit under `task`.
- Git, not backlog, but load-bearing for the ignored-board check: under a `.boris/`
  ignore pattern, `git check-ignore -q .boris` exits 1 while nothing exists on disk,
  and probing a child path exits 0 *(probe, git 2.55.0; re-verify on a git upgrade)*.

## chezmoi source resolution

Probes against the dotfiles source at `~/code/dotfiles`. **Re-verify on a chezmoi
upgrade or a change to the rendered symlinks.**

- `~/.claude/skills` is a symlink to `~/.agents/skills`, and `chezmoi source-path`
  answers `not managed` with exit 1 for a path under the symlink while resolving the
  same file under `~/.agents/`. A session that probes the `~/.claude` path reads the
  answer as license to edit the rendered tree, and `chezmoi apply` erases the edit
  *(probe, chezmoi 2.72.0)*.

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
- **Show-your-thinking instructions** can trigger the `reasoning_extraction` refusal
  category on Fable 5 and Mythos 5 only, with elevated fallback to Opus 4.8; read
  structured `thinking` blocks instead. Not carried by Opus 5.

# Artifact-class checks: budgets, sub-agent specifics, router specifics

Tier-3 reference for `agents/instructions-reviewer.md` §1, §7, and §8. Read §Per-file
budgets on every review; read §Sub-agent specifics and §AGENTS.md / CLAUDE.md specifics
only when a target is that class.

## Per-file budgets

`scripts/check-corpus-budgets.sh` measures these: edit the two together. A line
ceiling binds only while lines stay comparable; the script checks chars/line against
the corpus median and records its exemptions. The remedy for an over-budget file is
consolidation or a split, never rewrapping.

- **Always-loaded routers** (`CLAUDE.md`, `AGENTS.md`): target < 60 lines; the vendor's
  < 200 is a recommendation, not a cap. Where every section is a house delta, judge
  each line by the keep-side test rather than trimming to hit 60.
- **`MEMORY.md`**: a mechanical limit: first 200 lines or 25KB load, the rest silently
  dropped (`instruction_external_facts.md` §Harness mechanics). Over the line limit is
  a Blocker; near the 25KB half is "needs measurement (`wc -c`, frontmatter and block
  comments excluded)".
- **SKILL.md body**: < 500 lines; longer goes to linked tier-3 files. Slash commands
  take the same budget.
- **Sub-agent system prompts**: 30–150 lines; a single-mandate specialist resolving a
  body of doctrine earns up to 250, every extra line under the keep-side test; past
  250, split class-conditional or release-coupled material into tier-3 references
  under `agents/references/`. `instructions-reviewer.md` is the one file exempt from the
  250, bounded by a 31,000-byte ceiling instead: report "needs measurement (`wc -c
  dot_agents/agents/instructions-reviewer.md`)" against it. The exemption retires when
  that file drops under 250 lines.
- **Just-in-time rule files**: length is fine *if* loaded on demand, never if
  always-on. Output styles are budgeted here when loaded on demand and as routers when
  a settings `outputStyle` makes them always-on; a tier-3 reference takes the
  on-demand rule with a 500-line ceiling.
- **`.claude/rules/` files**: with `paths:` frontmatter, the just-in-time budget;
  without it, the always-loaded router budget.
- **Hook-injected instruction text**: budgeted against the reach its event buys: a
  `UserPromptSubmit` injection takes the router budget; a `PostToolUse` injection
  fires per tool call, so a few lines and a pointer, never a restatement.

## Sub-agent specifics

- **Output contract.** Specify the return shape, path style, format, required
  sections, and any caller-relevant bound.
- **File-based handoffs.** When the agent has a write-capable tool and the pipeline
  crosses context boundaries, prefer a defined artifact over a prose return. Otherwise
  require a complete inline return.
- **Caller-context leakage.** Determine caller context from the artifact's
  frontmatter, supplied launch contract, and `instruction_external_facts.md` §Harness
  mechanics. Flag reliance on prior discussion, caller-only reads, or other unnamed
  state.
- **Completion gate.** The prompt must specify a completion criterion that is
  *checkable* (the agent can tell done from not-done) and, where partial work is the
  risk, *exhaustive* ("every modified model accounted for," not "produce a change
  list": the pair is verbatim from `instruction_external_facts.md` §Cited sources,
  *Writing Great Skills*). A vague criterion invites the rush.
- **One mandate.** The description and prompt serve one coherent task; enumerating
  unrelated task categories confuses dispatch and accretes tool grants (mechanism:
  `instruction_external_facts.md` §Cited sources, *Claude Code Instruction-Artifact
  Mechanics*).
- **Judge gates gather evidence.** An agent installed as a correctness gate must
  mandate independent evidence (read the source, run the probe, compare against a
  reference), not bare judgment: a reference-free judge passes wrong answers at a
  measured high rate, and pairwise designs carry position bias, so query both orders
  or declare ties (`instruction_external_facts.md` §Cited sources, *Judging
  LLM-as-a-Judge*).
- **Embedded verification, newly added, has not been shown to fire.** Diff-seed mode
  only: when the diff appends a verification step to a producing skill's or agent's
  body, report a Minor naming the probe: invoke it on a fresh task and confirm the
  step runs. Do not raise it on a check already standing in the corpus.

## AGENTS.md / CLAUDE.md specifics

- **Project-root AGENTS.md.** Require only non-discoverable commands, constraints,
  conventions, and boundaries needed to work safely in that repository.
- **Personal-rules AGENTS.md**: expect a router: pointers to rules files, no
  project-specific content.
- **CLAUDE.md specifics**: `@path` imports; discovered files are concatenated, not
  overridden, so a project file does not supersede the user file and a cross-level
  contradiction stays live (`instruction_external_facts.md` §Harness mechanics).
  Cross-tool portability: `ln -s AGENTS.md CLAUDE.md` (chezmoi: `symlink_` prefix); if
  both exist with duplicated content, suggest the symlink.
- **`/init` slop.** Flag anything a competent agent would derive unaided.

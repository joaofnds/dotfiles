# SDLC Instruction Corpus — Review

Review date: 2026-07-25
Target: `dot_agents/` (AGENTS.md, workflows.md, 5 agents, 14 skills, rules/)
Harness verified against: Claude Code 2.1.220, model `opus[1m]`

## Summary

The corpus does not need better prompting. Measured against Anthropic's current
guidance it is already in the top few percent: emphasis density is near zero
(2 all-caps imperatives in ~9,000 lines), hedge phrases are absent outside the
reviewer that bans them, progressive disclosure is real rather than nominal, and
the "double-check your answer" restatements that Opus 5 punishes have already
been purged.

What it has instead is **drift between the instructions and the harness they run
on**. Four cross-references point at skills the model can no longer invoke; the
personal router leaks into every subagent and contradicts their output contracts;
two of four reviewers carry suppression language that the Opus 5 guidance
specifically names as recall-reducing. None of these are style problems. All of
them change what the agent actually does.

Separately, the two largest levers the harness offers — per-skill and per-agent
`effort`, and the bundled `/run` + `/run-skill-generator` runtime skills — are
entirely unused.

Findings are ordered by blast radius. Each names the evidence that settles it.

---

## 1. Four routing targets are unreachable by the model

**Evidence.** `claude --version` → 2.1.220. Per the Claude Code skills reference:
"`/verify` and `/code-review` run only when you invoke them. Before v2.1.215,
Claude could also run them on its own." Per the commands reference, `/review` and
`/security-review` are built-in commands, not skills, and never auto-invoke.

The corpus routes to all four as if the agent could take them:

| Site | Text |
| --- | --- |
| `skills/build/SKILL.md:33` | "Use `/verify` when available, handing it the spec." |
| `skills/panel-review/SKILL.md` description | "the narrower built-in (/security-review, /code-review) is cheaper" |
| `skills/adversarial-review/SKILL.md` description | "For code you did NOT write … → /review or /code-review instead" |
| `workflows.md:16,47` | `/verify` as a named pipeline stage |

**Why it matters.** The `/build` case degrades gracefully — step 7 has an
"Otherwise" branch — so the cost is a dead instruction, not a stall. The two
skill *descriptions* are worse: they sit in dispatch context every turn and tell
the orchestrator to prefer a cheaper route it cannot take. The orchestrator
either burns the expensive route anyway or reports a recommendation the user has
to act on manually, with nothing in the text saying so.

**Fix.** Reframe every one of these as a user action, not an agent action:
"stop and tell the user to run `/verify` against the spec"; in the skip clauses,
"the user can run `/code-review` for a single axis." Delete `/verify` from
`workflows.md`'s stage list or mark it user-driven.

## 2. `AGENTS.md` loads into every subagent and contradicts their output contracts

**Evidence.** `~/.claude/CLAUDE.md` is a symlink to `~/.agents/AGENTS.md`. The
Claude Code sub-agents reference: "Explore and Plan skip your CLAUDE.md files and
the parent session's git status … Every other built-in and custom subagent loads
both."

So every `code-reviewer`, `testing-reviewer`, `refactoring-reviewer`,
`instructions-reviewer`, and every general agent spawned by `/panel-review`,
`/adversarial-review`, `/research`, and `/kaizen` receives:

- **"the first substantive reply must begin with exactly one of: `Reading:` …"** —
  which collides with `instructions-reviewer`'s "Produce one review document, in
  this order: `# Review: <absolute file path>`" and with the other three
  reviewers' "Worst first, opening with a **Top 3 by payoff** callout". Two
  instructions, both mandatory, both about the first line. The model resolves it
  silently — the corpus's own *conflict-silent compliance* failure mode.
- **The English-coaching section** — fires in a context with no user to coach.
- **The `Decision:` block mandate** — aimed at read-only agents that make no
  solution decisions and take no implementation tool calls.
- Roughly 68 lines per spawn. A `/panel-review` run is 6 reviewers plus one
  skeptic per Blocker/Major.

This is precisely the "Loading-path integrity" check in
`agents/instructions-reviewer.md` §1. It went unflagged because the reviewer that
would catch it inherits the same file and reads its rules as addressed to itself.

**Fix.** One sentence in `AGENTS.md`, under the lifecycle section: "These
announcements govern the main conversation. A subagent follows its own system
prompt's output contract and ignores this section." That also frees the
English-coaching block to be main-thread-scoped, which cuts the file toward its
own `< 60 lines` budget (it is currently 68).

## 3. Two reviewers instruct suppression; Opus 5 follows that literally

**Evidence — the split.** Four reviewer agents, three different policies:

- `refactoring-reviewer.md:59` and `testing-reviewer.md:119`: *"Precision
  outranks recall: a missed smell is tolerable, a bogus suggestion is not."*
  Plus *"One gate-failing finding makes the entire run a failure"* and
  *"**Nit** — never used."*
- `instructions-reviewer.md:57`: *"Report everything you find; rank it, don't
  withhold it. Severity ordering is the caller's filter, not yours — a
  suppressed Minor is a finding the caller never got to rank."*
- `code-reviewer.md`: silent; keeps a Nit tier.

**Evidence — the guidance.** *Prompting Claude Opus 5*, "Code review and
bug-finding": "If your review prompt says 'only report high-severity issues' or
'be conservative,' the model may follow that instruction literally and report
less; ask it to report everything and filter in a separate pass instead."

**Why it matters.** The separate pass already exists — `panel-review` §3
arbitration and §4 the kill step. So the filter runs twice, and the first run
happens inside a reviewer that has been told the *entire run fails* if one
finding doesn't clear the bar. That threat is asymmetric: withholding is
invisible, over-reporting is punished. On a model documented to find real bugs at
high precision anyway, the gate is buying little and costing recall.

The stated rationale — "noise gets the whole report skimmed and the good findings
die with the bad ones" — is real, but it is an argument about the *report the
user reads*, which is the orchestrator's output, not the reviewer's.

**Fix.** Split the gates by owner. Gate 1 (evidence, `file:line`, no impressions)
stays in the reviewer — it is a quality floor, not a severity filter. Gate 2
(net win under Beck's ordering / pillar priced) and the "Nit never used" ban move
to `panel-review` §3. For standalone callers, replace them with one line:
"Report Minor findings; the caller filters." Drop "one gate-failing finding makes
the entire run a failure" — it is the sentence doing the suppression work.

**Caveat, held to this corpus's own bar:** this is a mechanism argument plus a
cited vendor claim, not a measurement. It is the kind of change that should be
run against a held-out task before being trusted.

## 4. `effort` and `model` are supported everywhere and used almost nowhere

**Evidence.** Both frontmatter tables list them. Skills accept `model` and
`effort` (`low|medium|high|xhigh|max`). Sub-agents accept `model`, `effort`,
`background`, `isolation`. The corpus sets `model` on exactly one agent
(`instructions-reviewer: opus`) and `effort` on none.

*Prompting Claude Opus 5*: "`low` and `medium` effort produce strong quality at a
fraction of the tokens and latency of higher settings … use `low` and `medium`
liberally as your primary control for token cost and response time wherever
quality holds, and step up to `xhigh` for demanding coding and agentic work."
And, for review specifically: "Accuracy holds at lower effort settings, which
supports a fast pass at review time and a more thorough pass later."

**Where it lands, concretely:**

- `panel-review`'s skeptics refute one claim against one file — the textbook
  `effort: low` case, and there is one per Blocker/Major.
- The four `code-reviewer` axis instances run in parallel on a bounded patch —
  `medium` is the documented starting point for review.
- `instructions-reviewer` and `grill` are the `xhigh` cases: heaviest doctrine
  load, and the stage where a wrong call propagates through `/plan` into `/build`.
- `stop-slop`, `handoff`, and `dream`'s Phase 1/5 mechanics are `low`.

This is the largest cost lever available in the harness, and pulling it is a
one-line frontmatter edit per artifact. Set it, then sweep on real tasks — the
vendor's own instruction is to re-run an effort sweep rather than inherit
defaults.

## 5. The producer gate is unconditional, and the front half runs it four times

`/discuss`, `/research`, `/grill`, `/diagnose`, and `/plan` each end by spawning
an adversarial reviewer. The shared rule in `adversarial-review` §"As a producer
gate": *"It fires on any non-trivial artifact."* A full front half —
`/discuss → /research → /grill → /plan` — is four subagent gates before a line of
code is written, then `/build`, then a `/panel-review` of 6 + N.

*Prompting Claude Opus 5*, "Controlling subagent spawning": "Do not delegate work
you can finish yourself in a handful of tool calls, and do not use subagents to
verify or double-check your own work … keep spawn counts low."

**The carve-out is correct; the trigger is not.** `adversarial-review`'s
mechanism — withholding your conclusions so a fresh context reaches its own — is
genuinely different from self-verification, and `instructions-reviewer.md:155`
already draws that line explicitly ("This does not touch *chained* verification:
a separate reviewer call or a fresh-context critic is a different mechanism and
stays"). That reasoning holds. The problem is that "non-trivial" is undefined, so
the gate fires unconditionally on artifacts of every size.

**Fix.** Define the trigger by stakes in the single-sourced section: fire when the
artifact ratifies something expensive to reverse — `/grill`'s pick, `/plan`'s
approach, a `/diagnose` that a later `/plan` will build on. A one-page spec or a
short diagnosis gets a stated self-read instead, said out loud, same as the
existing skip rule.

## 6. No length calibration on any written deliverable

*Prompting Claude Opus 5*, "Written deliverable length": "files that Claude Opus 5
writes to disk (reports, Markdown documents, summaries) are often longer than on
prior models … add explicit length calibration."

The chain writes `-spec.md` → `-options.md` → `-grilled.md` → plan →
`-diagnosis.md` → `.boris/reviews/*.md` → handoff. `/build` step 1 reads the plan
**plus every artifact it cites**. Only `plan` ("no code blocks longer than ~10
lines") and `handoff` ("keep it tight") calibrate at all, and neither calibrates
prose.

Bloat here does not just cost tokens once — it compounds into the executing
session's context, which is the one place the corpus is otherwise most careful
about.

**Fix.** One line in the shared producer-gate section: "Match length to
substance. No filler sections, no redundant summaries, and never restate an
artifact you cited by path."

---

## Minor

**7. `metadata.trigger` is inert; `when_to_use` is the real field.** Thirteen
skills carry a `metadata: trigger:` key. It is absent from the Claude Code
frontmatter reference. The sanctioned field for exactly this content is
`when_to_use` — "Additional context for when Claude should invoke the skill, such
as trigger phrases … Appended to `description` in the skill listing." The trigger
lines currently restate the description's own "Invoke on …" clause, which is the
corpus's own *instruction laundering* smell. Either delete them, or migrate to
`when_to_use` and strip the duplicated phrasing from `description`. (If they are
there for the agentskills.io open standard rather than Claude Code, say so in a
comment — the choice is defensible, the silence isn't.)

**8. The personal `/debug` shadows the bundled `/debug`.** Docs: "A skill at any
of these levels also overrides a bundled skill with the same name." The bundled
one enables debug logging and troubleshoots runtime issues. The override is
probably the right outcome, but right now it is accidental. Make it a decision:
a comment in the skill, or a rename.

**9. `dream/SKILL.md:45` pins a stale model.** "run that subagent on the most
capable reasoning model available at high reasoning effort — currently **Opus
4.8, high effort**." The first clause is the durable instruction; the second
contradicts it with a version that is already behind (`opus[1m]` is the session
model). This is `instructions-reviewer` §7 "Over-specification: model versions rot
within a sprint" firing on the corpus. Delete the version.

**10. `AGENTS.md` is 68 lines against its own `< 60` budget.** Trivial in
isolation; worth fixing as the by-product of finding 2, since scoping the
lifecycle and coaching sections to the main thread is where the lines come from.

---

## Checked and sound — do not touch

Recording these so a later pass does not re-litigate them:

- **Emphasis density.** Two occurrences of `MUST|NEVER|ALWAYS|CRITICAL|IMPORTANT`
  in caps across the whole corpus. This is the discipline Anthropic asks for on
  4.5+ ("Where you might have said 'CRITICAL: You MUST use this tool when...',
  you can use more normal prompting"). Nothing to dial back.
- **Hedges.** Nine hits for `try to|where appropriate|when reasonable|as needed|
  if in doubt`; five are inside `instructions-reviewer` quoting them as banned.
- **Self-verification restatements.** None of the banned form. Every verification
  instruction in the corpus is execution-evidence-grounded — capture the output,
  cite the command, "only tool output counts". That targets a failure mode Opus 5
  still has (fabricated verification), not one it has outgrown. Correctly kept.
- **Progressive disclosure.** Real, not nominal: `testing/` splits four ways,
  `refactoring/` fans to 80 catalog files, `stop-slop` to three references — all
  one level deep from their entry file, as the guidance requires.
- **Examples.** `testing/02` and `03` are built on BAD/GOOD pairs. That is the
  highest-leverage pattern available and it is used well.
- **Dispatch surface.** Longest description is 828 characters, under the 1,536
  listing cap. Skip-when clauses are present and reciprocal across all four
  reviewers.
- **Least privilege.** All four reviewers are `Read, Grep, Glob`. All three are in
  the reduced background-subagent tool set, so no foreground/background
  divergence — the trap `instructions-reviewer` §2 warns about does not bite here.

---

## Two notes on `AI_ENGINEERING_ADVANCEMENTS.md`

Its citations check out — arXiv:2602.11988 (*Evaluating AGENTS.md*) and
arXiv:2603.00822 (*ContextCov*) both exist and say what the doc says they say.
Its "What Not to Add" list is right, and nothing above proposes a new rule file.

**I would invert its top two priorities.** It ranks corpus CI first and the
untrusted-content boundary third. `~/.claude/settings.json` sets
`"defaultMode": "bypassPermissions"`, which removes the harness backstop that
would otherwise contain an injected action — while `/research` reads the web,
`/debug` reads logs and traces, and `/panel-review` reads arbitrary patches.
Evaluations measure the corpus; they do not contain it. The one-paragraph rule is
a day's work against a live exposure; corpus CI is a project.

**Its rank-4 gap is already solved and free.** The doc asks for an "agent-legible
runtime environment" — one app instance per worktree, reproducible workloads,
machine-readable criteria. Claude Code ships `/run`, `/verify`, and
`/run-skill-generator` for exactly this; the last one gets the app running from a
clean environment and commits the recipe as a per-project skill at
`.claude/skills/run-<name>/`, after which every agent in the repo uses it.
Running it once per project is the cheapest item on that entire roadmap, and it
is also what makes `/build` step 7 mean something.

---

## Recommended order

1. Finding 1 — rewrite the four unreachable routes as user actions. Minutes.
2. Finding 2 — one sentence scoping the lifecycle protocol to the main thread.
3. Finding 4 — set `effort` on skills and agents; sweep on real tasks after.
4. Findings 5 and 6 — stakes-based producer gate, length calibration; both edit
   the single-sourced section in `adversarial-review`.
5. Finding 3 — move the suppression gates to the orchestrator. Highest value,
   highest uncertainty; this is the one worth an A/B before trusting.
6. Minors 7–10 as a batch, then one `instructions-reviewer` run over the result.

## Sources

- [Prompting best practices](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices)
- [Prompting Claude Opus 5](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-opus-5)
- [Skill authoring best practices](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices)
- [Effective context engineering for AI agents](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)
- [Claude Code: skills](https://code.claude.com/docs/en/skills)
- [Claude Code: sub-agents](https://code.claude.com/docs/en/sub-agents)
- [Claude Code: commands reference](https://code.claude.com/docs/en/commands)

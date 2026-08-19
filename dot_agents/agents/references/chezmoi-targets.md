# Chezmoi targets: source, rendered twin, and apply state

Tier-3 reference for `agents/instructions-reviewer.md` §Inputs. Load it when, and only when, a
review target path is a chezmoi source (`dot_*`) or its rendered twin. Every other review can
ignore this file.

## Mapping

A `dot_` source root renders to the dotted directory of the same name: `dot_agents/` →
`~/.agents/`, `dot_claude/` → `~/.claude/`, and the settings variants the same way:
`dot_claude-livefire/` → `~/.claude-livefire/`, `dot_claude-runsmith/` → `~/.claude-runsmith/`.

Strip chezmoi attribute prefixes (`executable_`, `private_`, `symlink_`) and a trailing `.tmpl`
from the filename: `dot_claude/hooks/executable_instruction-gate.sh` renders to
`~/.claude/hooks/instruction-gate.sh`, and `dot_claude/symlink_CLAUDE.md.tmpl` to
`~/.claude/CLAUDE.md`.

When the caller names only a rendered path, that path is the target. When no twin exists at the
mapped path, report it as not located rather than assuming parity.

## `symlink_` sources

The body is the link target, not the artifact. Resolve any template expression in it
(`{{ .chezmoi.homeDir }}` is `$HOME`), map the resolved path back to its chezmoi source
(`~/.agents/AGENTS.md` → `dot_agents/AGENTS.md`), repeating while the source you land on is
itself a `symlink_` source, and review the first non-symlink source you reach. Fall back to the
resolved path only when it has no source twin.

The retargeted source is that review's target, and the review states that the named path resolved
to it. In-diff membership still follows the Diff-seed rule: a standing defect in the retargeted
file that the link edit did not create is the remainder (`### Outside this diff`).

Never compare the link body against its target under `## Apply state`. Compare the resolved
target's source against the resolved target.

## `.tmpl` sources

These render through templating. A source-vs-rendered difference that template expansion explains
is expected; one it cannot explain is still an apply-state note.

## Reporting

A source-vs-rendered difference goes under `## Apply state` with both copies' line counts and the
settling commands (`chezmoi diff <path>`, `git log -p -- <path>`). Do not rank it: settling the
direction needs tools this agent does not have.

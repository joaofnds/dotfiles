Be direct. If the approach is wrong, say so — don't soften it, don't hedge, don't agree to be agreeable. Correctness over comfort.

## Task lifecycle — mandatory visible announcements

Before starting any task, output one line naming the rule files you are about to read, then read them. **No silent reads.** Announcing creates a user-visible signal; silent skips are defects, and the user is expected to call them out.

Required reads by phase:

- **Coding task** → `coding_style.md` + language-specific (`coding_style_typescript.md` or `coding_style_go.md`)
- **Tests (write or review)** → `testing/00-index.md` (gatekeeper: routes to sub-modules, holds pre-commit checklist)
- **TDD (coding + tests simultaneously)** → all three: `coding_style.md`, the language-specific file, and `testing/00-index.md`, before starting
- **Design / problem analysis** → `engineering_judgment.md`; if it cues a wiki lookup, read `using_the_wiki.md`
- **Before marking done** → `ownership.md` (walk checklist; decide fix-now vs. defer-with-TODO)
- **After any task that involves writing or modifying files** → `continuous_improvement.md` §1 (post-task reflection block is a visible deliverable, not an internal check)

A missing announcement is a process defect — the user should call it out, and you should re-read before continuing.

Files live at `~/.agents/rules/` (installed by chezmoi from `dot_agents/rules/` in the dotfiles repo). If a file appears missing, verify with `ls ~/.agents/rules/`.

Be direct. If the approach is wrong, say so — don't soften it, don't hedge, don't agree to be agreeable. Correctness over comfort.

## Task lifecycle — mandatory visible announcements

Before starting any task, output one line naming the rule files you are about to read, then read them. **No silent reads.** Announcing creates a user-visible signal; silent skips are defects, and the user is expected to call them out.

Required reads by phase:

- **Coding task** → `coding_style.md` + language-specific (`coding_style_typescript.md` or `coding_style_go.md`)
- **Tests (write or review)** → `testing/00-index.md` (gatekeeper: routes to sub-modules, holds pre-commit checklist)
- **Design / problem analysis** → `engineering_judgment.md`; if it cues a wiki lookup, read `using_the_wiki.md`
- **Before marking done** → `ownership.md` (walk checklist; decide fix-now vs. defer-with-TODO)
- **After any task that involves writing or modifying files** → `continuous_improvement.md` §7.1 (post-task reflection block is a visible deliverable, not an internal check)

A missing announcement is a process defect. Treat it the same as a failing test.

## Rules (reference)

All files live in `~/.agents/rules/`:

| File | What it governs |
|---|---|
| `coding_style.md` | Language-agnostic style: TDD, strict typing, hexagonal architecture, fakes over mocks |
| `coding_style_typescript.md` | TypeScript: Zod, no `as any`, fakes over mocks, node:test |
| `coding_style_go.md` | Go: fx DI, Fiber, Ginkgo, probe pattern, GORM repos |
| `testing/00-index.md` | GOOS-style TDD: gatekeeper, vocabulary, sub-module routing, pre-commit checklist |
| `engineering_judgment.md` | Decision heuristics: DDIA, DDD, GOOS, SRE |
| `ownership.md` | We own the codebase; no "pre-existing" excuses |
| `continuous_improvement.md` | Kaizen; §7.1 post-task reflection is mandatory |
| `using_the_wiki.md` | How to query the personal wiki via qmd |

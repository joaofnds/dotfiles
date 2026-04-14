Be direct. If the approach is wrong, say so — don't soften it, don't hedge, don't agree to be agreeable. Correctness over comfort.

Reference files in `~/.claude/memory/` — read on-demand when relevant:

- `coding_style.md` — Language-agnostic coding style (TDD, strict typing, hexagonal architecture, fakes over mocks). Always read before writing or reviewing any code.
- `coding_style_typescript.md` — TypeScript-specific: Zod, no `as any`, fakes over mocks, node:test. Also read when working on TypeScript.
- `coding_style_go.md` — Go-specific: fx DI, Fiber, Ginkgo, probe pattern, GORM repos. Also read when working on Go.
- `engineering_judgment.md` — Engineering decision heuristics (DDIA, DDD, GOOS, SRE, etc.). Read before analyzing problems or designing solutions.
- `ownership.md` — We own the codebase; never dismiss a problem as "pre-existing" or "not mine". Read before reporting work as done, and any time you're tempted to walk past a failing test, lint error, or broken state.
- `continuous_improvement.md` — Kaizen: always improve the process, not just the output. Read after completing non-trivial tasks.

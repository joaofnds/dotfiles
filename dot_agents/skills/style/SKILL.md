---
name: style
description: The house coding style, the concrete patterns and designs expected in code written for João. One core reference plus per-language files for Go, TypeScript, and frontend work. Load when writing or reviewing code; the review skill's Style and Architecture briefs condense these rules and this skill holds the fine detail.
---

# Style

The house coding style lives in this skill's reference files, one rule stated once.

## What to load

- [references/core.md](references/core.md), for any code in any language. Its
  preamble holds the precedence ladder and the conflict conduct.
- [references/go.md](references/go.md) when the task touches Go.
- [references/typescript.md](references/typescript.md) when the task touches
  TypeScript.
- [references/frontend.md](references/frontend.md) when the task builds UI, on top
  of the language file.

The build skill loads these when writing code. The review skill's Style and
Architecture briefs cite them for fine detail. Testing discipline is not here; it
lives in the testing skill, with the doctrine above both.

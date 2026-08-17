# Writing Instructions

The bar every instruction edit must clear. It covers exactly these files: `AGENTS.md`,
`CLAUDE.md`, `GEMINI.md`, rules, skills, slash commands, agent definitions, output
styles, and hooks that inject instruction text. Not `workflows.md`, memory files, or
`.boris/` documents — this bar does not check them; whether an agent must follow one
is settled where that file is routed. It applies to this file too. The bar governs text you add or rewrite; bringing an existing file up to it
is its own task, never a side effect of an unrelated edit.

An instruction is a cost paid on every load.

- **Change an action.** A rule says what the agent does differently, and when. A
  prohibition qualifies: it names the action not to take. A rule that asks only for
  awareness or care names no action either way; it changes nothing — record the
  incident in git history instead of writing it.
- **Complete in place.** The reader complies using only the text in front of them.
  Never reference a file to justify a rule, and never cite by section number:
  headings move and nothing updates the pointer. A number that is part of the target
  heading's own text (`coding_style.md` §3) is a heading citation, not a section
  number; write cross-file citations as `file.md` §Heading. Two exceptions to the file
  reference, never to the section number: material the reader must open to act — a
  checklist to run, a catalog to pick from — and a claim about outside facts (the
  harness, a vendor, a paper), which names the file and heading where its evidence
  lives.
- **No provenance in loaded prose.** Git history holds when a rule changed and why.
  No inline dates, incident narratives, or version notes. The one exception is a
  re-check trigger: name what to re-check, the event that fires it — a release, a
  model swap, a calendar date only when no event exists — and the state it was last
  checked against.
- **Deletion first.** Prefer the fix that is a deletion or a shorter rewording. A
  new rule deletes the rule it supersedes in the same edit. An edit that grows a
  file states, in its commit message, the action the new lines change and what they
  replaced, or that they replaced nothing.
- **One home.** State a rule once, in the file its audience loads; delete
  restatements. One exception: when the harness fixes two audiences apart — a skill
  description read without opening the body, a sub-agent prompt, hook-injected
  text — each copy is the only one on its path. Keep every copy, and mark each one
  with the path and heading of the others.
- **Written for someone acting now.** Imperative, concrete, plain words. Rationale
  is one sentence at most; scope, conditions, and exceptions are the rule, not
  rationale. An example only where the rule is ambiguous without one.

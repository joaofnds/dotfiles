# Writing Instructions

## The bar

The bar every instruction edit must clear. It covers exactly these files: `AGENTS.md`,
`CLAUDE.md`, `GEMINI.md`, rules, skills, slash commands, agent definitions, output
styles, and hooks that inject instruction text. Not `workflows.md`, memory files,
fixtures and cases under `evals/`, `review-checklist.md`, or `.boris/` and `backlog/`
documents: this bar does not check them; whether an agent must follow one is settled
where that file is routed. One exception runs the other way: instruction text a plan or
spec embeds for later landing, a verbatim template or a per-file content contract, is
governed as if landed in its destination file. It applies to this file too. The bar
governs text you add or rewrite; bringing an existing file up to it is its own task,
never a side effect of an unrelated edit.

An instruction is a cost paid on every load.

- **Change an action.** A rule names what the agent does differently, and when: an
  action, an artifact, an omission, an evidence requirement, or a boundary. A
  prohibition qualifies: it names the action not to take. A rule that asks only for
  awareness or care names none of these; it changes nothing; record the incident in git
  history instead of writing it. (The same five are mirrored in
  `instructions-reviewer.md` §5. Specification rigor and in
  `instruction-failure-modes.md` §No-op / self-reference; edit together.)
- **Complete in place.** The reader complies using only the text in front of them.
  Never reference a file to justify a rule. Two exceptions: material the reader must
  open to act, a checklist to run or a catalog to pick from; and a claim about outside
  facts (the harness, a vendor, a paper), which names the heading in
  `instruction-external-facts.md` where its evidence lives.
- **Cite by heading, never by section number.** Headings move and nothing updates the
  pointer. Write cross-file citations as `file.md` §Heading, carrying the heading's own
  words: `coding-style.md` §3. Code Construction & Decoupling Patterns, never
  `coding-style.md` §3. Where the target is a bolded rule label rather than a heading,
  name the label the same way.
- **No provenance in loaded prose.** Git history holds when a rule changed and why.
  No inline dates, incident narratives, or version notes. The one exception is a
  re-check trigger: name what to re-check, the event that fires it, a release, a
  model swap, a calendar date only when no event exists, and the state it was last
  checked against.
- **Deletion first.** Prefer the fix that is a deletion or a shorter rewording. A
  new rule deletes the rule it supersedes in the same edit. An edit that grows a
  file states, in its commit message, the action the new lines change and what they
  replaced, or that they replaced nothing.
- **One home.** State a rule once, in the file its audience loads; delete restatements.
  One exception: a rule may appear once per co-loaded path, so a copy on a path the
  router never combines is that path's only copy, and deleting it removes the rule from
  that phase. A skill description read without opening the body, a sub-agent prompt, and
  hook-injected text are the common cases. Keep every copy, and mark each one with the
  path and heading of the others.
- **Written for someone acting now.** Imperative, concrete, plain words. Rationale
  is one sentence at most; scope, conditions, and exceptions are the rule, not
  rationale. An example only where the rule is ambiguous without one. Plain
  punctuation: no em dashes, and no en dash as an aside; colons, semicolons,
  commas, and parentheses carry asides. A range keeps its en dash, and quoted
  verbatim text keeps its punctuation.

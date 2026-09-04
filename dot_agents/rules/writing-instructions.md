# Writing Instructions

## The bar

The bar every instruction edit must clear. A file is covered when it loads into a
model's context to govern how it works: `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`, rules,
skills, slash commands, agent definitions, output styles, the reference files those
route into, and hooks that inject instruction text. A document an agent merely consumes
as task input is not covered, however imperative it reads. Three carriers load and are
still not checked here: memory files, fixtures and cases under `evals/`, whose defects
are planted, and `workflows.md`, which is gated by form. One exception runs the other
way: instruction text a plan or spec embeds for later landing, a verbatim template or a
per-file content contract, is governed as if landed in its destination file. The bar
applies to this file too. It governs text you add or rewrite; bringing an existing file
up to it is its own task, never a side effect of an unrelated edit.

An instruction is a cost paid on every load.

- **Change an action.** A rule names what the agent does differently, and when: an
  action, an artifact, an omission, an evidence requirement, or a boundary. A
  prohibition qualifies: it names the action not to take. A rule that asks only for
  awareness or care names none of these; it changes nothing; record the incident in git
  history instead of writing it. (The same five are mirrored in
  `instructions-reviewer.md` §5. Specification rigor and in
  `instruction-failure-modes.md` §No-op / self-reference; edit all three together.)
- **Principle over case list.** State the reason a rule exists and the test that reason
  implies; keep a list only where its entries carry what the reason cannot regenerate (a
  path another file must match, a scope boundary another rule binds against). A reader
  matches a case list against the context in front of them and stops at the first
  context you did not foresee, while a reason reaches contexts neither of you can name.
  Adding a case to any other list is the signal to replace it with the reason its cases
  share.
- **Name the consumer.** A rule mandating an action names what sees the evidence it
  happened: an artifact a later step reads, a hook that fires on it, another rule keyed
  to it, or a line the rule requires in the reply. The test is whether a run that skipped
  the action is distinguishable from one that took it; the agent's word that it complied
  is not evidence. Where nothing distinguishes them, carry the rule in the strongest
  mechanism that fits (`continuous-improvement.md` §3. Root Cause and PDCA ranks them) or
  delete it.
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

# Corrections rules

Rules distilled from
`dot_agents/skills/review-instructions/references/corrections-log.md`, each written
as it would stand among the checks in the review-instructions skill, so the checks
apply to this file. Each rule carries an Evidence line naming the log entries and
commits behind it, and that line stays behind when the rule moves. That skill's
section The corrections log says how an entry is filed and when a rule moves. The
corpus commits from the swap (50539135) to 2026-09-06 were read once, and a class
they show that the checks already carry is not listed.

## Rules

### Facts live in the rulebook, procedures in skills

Put a file that states rules as facts, with no procedure of its own, in the
rulebook and route to it from the read table, because a rules file loads when a
task's row names it and a skill loads only when invoked. A skill carries a
procedure a session runs.

Evidence: commits 8e7fb024, 3fd52fe1.

### A router carries only the routing

Keep a skill whose job is to send work elsewhere to the routing and nothing else,
because every line past the route is paid for by a session that came only to find
its next file.

Evidence: commit e94cb807, João: "I thought the review agents would be just a
router, but it ended up being a giant file."

### Measure what a change makes a session load

Measure the context a change adds to what a session loads, at launch or on a route,
before it lands, and record the number in
`dot_agents/skills/review-instructions/references/external-facts.md`, because a
link, an import, or a repeated read multiplies the context while no single line
looks expensive.

Evidence: entry "2026-09-06 split review out of the build and shape sessions";
commit b55eaf36.

### A record carries the context its reader lacks

Where a rule has a session write a record another session reads, require it to
carry what the session was doing and what it saw, beside any words it quotes,
because the reader cannot reparse the moment from the words alone.

Evidence: entry "2026-09-06 log the problem with context, not only his words".

## Checks that did not hold

### Write for one mind

Entry "2026-09-06 the frame rules routed every doubt to João instead of teaching the
session to find the box". The check lists where a rule may name him and forbids the
rest, and a gate that sent every unsourced criterion to him passed the review that
landed it. The check now carries that gate's failing and corrected forms.

Entry "2026-09-06 the log's triggers gated on João asking". The session wrote a
description trigger as "when João questions or complains" under the check's
allowance for naming him as a fact a rule turns on, and the reviewer of the edit
passed it. The reviewer of the fix: the same check stated more narrowly is the fix
the verdict rule forbids, and the description case is mechanically checkable, so
the guard is a script over model-invocable descriptions, to add once DOT-62 empties
them of his name.

## No rule

- "2026-09-06 keep a log of corrections to the corpus", a directive for a new
  mechanism.
- "2026-09-06 consolidate the log into rules, and read the history since the swap",
  a directive for a new mechanism.
- "2026-09-06 the second entry moves a rule into the checks", a decision that
  changed nothing.

# Corrections rules

Rules distilled from
`dot_agents/skills/review-instructions/references/corrections-log.md`, each written
as it would stand among the checks in the review-instructions skill, so the checks
apply to this file. Each rule carries an Evidence line naming the log entries and
commits behind it, and that line stays behind when the rule moves. That skill's
section The corrections log says how an entry is filed and when a rule moves.

Every entry in the log was read into this document on 2026-09-07, by two readers
grouping the entries independently. A class both readers found, with no check above
it, is a rule below. A class that falls under a check the skill already carries is
under Checks that did not hold, with the moment, and why the check did not bind is
left to the reviewer of the fix. A retroactive entry is weaker evidence than one
written in the turn, so a rule resting only on retroactive entries says so.

Four rules below have their second entry and are ready to move. No move was made,
because each grows the skill and that growth needs its own accounting, which the
verdict section requires and this session did not do.

## Rules

Four rules have a second entry and are ready to move into the checks. The move is
not made here, because it grows the skill and the growth was not accounted for.
Each carries its text and its evidence, so the move is one edit when it is taken.

### Account for what a rewrite replaces

Read the text a rewrite replaces before writing the replacement, and set old beside
new. Account for every rule, reason, scope, force, exception, ordering, and source in
the old text. Name each one as kept, as moved with its new home, or as cut with the
reason. A rewrite keeps only what its writer names, and the rest goes silently.

Moving this into the checks lets the verdict section's form-only audit cite it in
place of restating it, so the skill grows by less than the rule's own length.

Evidence: entries "the ownership instruction lost its stance" (e92259d4), "the
review no longer checked the goal, the style, the architecture, or the tests"
(0599be8a), "the comment rule is a test, not a ban" (4bf14374), "every rule, name,
criterion, and source from the old corpus is present" (025ef796), "a directed fix to
an ignored or non-repo file has no commit to end in" (98593964), "the old rules
directory's writing is sound" (c6343fb2). All retroactive.

### Hold a skill's text against his words

Set each sentence that grants or limits the session's authority, or fixes the
skill's scope, beside his words on it before the skill lands. Match the verb and the
object. A line past his answer is the session's own invention wearing his authority.

Evidence: entries "the triage skill set priorities itself where his answer said it
proposes them" (1173e09c), "a small fix found during triage may be committed"
(15bc2eb8), "handoff records the state of the session, not the state of the task"
(1874dcd5), "kaizen fixes stayed narrow to the invoking example" (c7bc91fa). All
retroactive.

### Facts live in the rulebook, procedures in skills

Put a file that states rules as facts, with no procedure of its own, in the rulebook
and route to it from the read table, because a rules file loads when a task's row
names it and a skill loads only when invoked. A skill carries a procedure a session
runs.

This one belongs inside Check the placement, whose first sentence already sorts what
loads always from what loads on a route, so it costs one clause there rather than a
check of its own.

Evidence: commits 8e7fb024 and 3fd52fe1. Entries "the board skill is rules stated as
facts" (3fd52fe1), "the doctrine and the refactor skill are rules with no procedure"
(8e7fb024), "the rules tree is canonical and the corpus refers to it" (2e113604).

### Never offer a hook or a settings change as the guard

Draw a guard from a type, a template, a script, or a CI gate. Leave the trigger in
the phase skill that runs, or leave the rule in prose. Hooks and settings are his,
and every one a session offered was declined or reverted.

This belongs inside Prefer enforcement to prose, which names a hook first among the
guards to consider, and Name the consumer offers a hook as a mechanism. Both would
have to drop the word in the same edit, or the prohibition and the two lists
contradict each other.

Evidence: entries "a Stop hook rewriting replies" (73d14ee4, 4f48a8ee), "no hook for
the review trigger" (1db70b35), "the kaizen on the session that satisfied its own
script" (9ad4809f). All retroactive.

Two more rules stayed here on one entry each. A commit is context and never the
second entry a move needs.

### A router carries only the routing

Keep a skill whose job is to send work elsewhere to the routing and nothing else,
because every line past the route is paid for by a session that came only to find
its next file.

Evidence: commit e94cb807, entry "the review skill was a giant file instead of a
router" (e94cb807), retroactive. One entry, so this is an incident until a second
repeats it.

### A review step has no applicability test

Write a step that reviews work as one every change takes. Never give it a property
the author reads off its own diff, because the author is the one reading it, and a
change is exempted by the person who wrote it.

Evidence: entry "the review criteria let the author decide review did not apply"
(56c3ddb6), retroactive. One entry, so this is an incident until a second repeats
it.

### A record carries the context its reader lacks

Where a rule has a session write a record another session reads, require it to
carry what the session was doing and what it saw, beside any words it quotes,
because the reader cannot reparse the moment from the words alone.

Evidence: entry "log the problem with context, not only his words".

### Measure what a change makes a session load

Measure the context a change adds to what a session loads, at launch or on a route,
before it lands, and record the number in
`dot_agents/skills/review-instructions/references/external-facts.md`, because a
link, an import, or a repeated read multiplies the context while no single line
looks expensive.

Evidence: entry "split review out of the build and shape sessions", and commit
b55eaf36.

## Checks that did not hold

### Read every sentence as the behavior and register it teaches

The style's own prose taught the register it forbade (79b335f7).
The setup-and-payoff cadence survived that rewrite (a9faa9c8). The triage skill
carried the rhythm the brief style's anti-example shows, and he pointed at the
anti-example (032c5aa4). He then asked how the register could have been prevented
at writing time, and the answer added the Before you write section and this check in
its present form (59dcf69a). The global file and eleven skill bodies carried the
same shapes (9a5bab10, 98de9f50). After the check landed, three more: the rules
added by the kaizen commit used figures of speech (227f0bd3), eight restored skills
were checked for em dashes and semicolons and not for the headline and the metaphor
he had named (1415cd4c), and he asked whether the ownership text kept the register,
where four spots did not (4a6d1264).

### Prefer enforcement to prose

He rejected a sentence-count ceiling for the reply register twice,
and the check gained the sentence about a numeric proxy (1fd06a38). The numeric
limits came out of the style the same day (79b335f7). Two days later a session
wrote a register lint under this check, rewrote the corpus to satisfy it, and
softened nine prohibitions into comparisons the patterns do not match (4901fecc).
The lint was deleted on his direction (00f9d915). The kaizen on that day found the
check's guard sentence was what the lint had been read out of (9ad4809f).

### Check the placement

In three shapes. The review router that shared its file with 170
lines of code-review axes is the same shape and is filed as its own rule above,
under A router carries only the routing.

An always-loaded file carried what one path needs: the comment rule in the global
file (16a401d2), the board and delivery rules inline in it (47b7f903), and the whole
ownership section in it (8e530127).

A rule reached only sessions that loaded an unread route: the what's-next rule sat
in a skill carrying disable-model-invocation (d51e6b80), the rule against writing to
the corpus without this skill lived in two files neither of which was loaded when it
broke (abc1b231), the style skill loaded in 17 of 80 coding sessions (9ef8f1e7), and
one routing sentence in the global file loaded it in one session of four where an
announcement block loaded it in four of four (c6e76c9d).

A trigger named a place in the board's flow: three reviewer descriptions said the
review skill sends work here after the build, and the sentence forbidding that
landed in the same commit (0cd650b8).

### Write for one mind

He asked for review-code's description in the shape of its siblings, which carried
"when João asks" (85c848ce), then said the same day that those lines make a session
skip the review because he did not ask (1db70b35).

Entry "2026-09-06 the frame rules routed every doubt to João instead of teaching the
session to find the box". The check lists where a rule may name him and forbids the
rest, and a gate that sent every unsourced criterion to him passed the review that
landed it. The check now carries that gate's failing and corrected forms.

Entry "2026-09-06 the log's triggers gated on João asking". The session wrote a
description trigger as "when João questions or complains" under the check's allowance
for naming him as a fact a rule turns on, and the reviewer of the edit passed it. The
reviewer of the fix ruled that the same check stated more narrowly is the fix the
verdict rule forbids, and the description case is mechanically checkable, so the
guard is a script over model-invocable descriptions, to add once DOT-62 empties them
of his name.

### One home

The coding style rules lived in the style skill, the review axes, and
the global file's code-craft bullet at once, and a session quoted the global copy as
the rule it had read and wrote a history-narrating block anyway (de9d5dba,
03ca8a90). The entry for the rules tree restored with about 6,300 lines of duplicate
under the skills is the same class and is filed above, as evidence for Facts live in
the rulebook.

### Read each rule literally, and write it so it can be

"Changed what's live" licensed a paragraph per fixed finding, because
after a fixing session every finding had changed what's live (e62866ad). "As if he
saw none of the work" licensed retelling in the reply what the notes had already
shown him (a9f7a321).

### Reason over command

A rule about the state of work was unstable alone and stable once a
real fired reply and its kept rewrite stood beside it (5efa05df). A reply opened on
a preamble and carried bold labels, where the old text produced the opener in three
runs of three and the text with the example produced it in none (8982ab6f).

### Detect conflicts

The triage skill said it edits nothing outside the backlog CLI while
the global rule said what you surface you close (15bc2eb8). The triage skill moved
cards while the global file said only the session doing the work moves them, and the
reviewer surfaced the collision but left the owning rule to him (d51e6b80).

### Earn each line, hardest on the lines you kept

A line that did not belong where it stood was moved instead of cut,
and he rejected it twice, with this skill open during the edit (fab396fc). A rule
requiring a report to say its top buckets are empty was carried on general grounds,
and he judged it unnecessary (95e52961).

### State the complement

The shape rule covered a prohibition and left a requirement to
inference, so a constraint derived from his decision became an acceptance criterion
and two sessions designed inside it (b08600bd). The em-dash ban named replies and
instruction files and left commits, documents, and code unstated, and his ruling
widened it twice (e9a0af32, 4bf14374).

### End steps on a checkable bound

Acceptance criteria named the approach a shaping session had
recommended, he chose another, and the card stalled at Done because its criteria
could not be met under the approach in use (0821f65c).

### Prefer the brief steer to the enumeration

The prompt skill listed the cases for choosing a model and an effort
level, above a line already carrying the reason those cases share (05d25616).

## No rule

- "keep a log of corrections to the corpus", a directive for a new mechanism.
- "consolidate the log into rules, and read the history since the swap", a directive
  for a new mechanism. Its second half, the history unread, is evidence under
  Account for what a rewrite replaces.
- "the second entry moves a rule into the checks", a decision that changed nothing.
- "split review out of the build and shape sessions", a cost he raised where the
  drafted edit was reverted. Its measurement is evidence under Measure what a change
  makes a session load.
- "a paste-ready prompt for work that deserves its own run" (b6cecfc4), a directive
  for a new skill.
- "overseeing between the loop's stages" (b17d8a55), a directive for a new skill.
- "no redundant reviewers and no agent per blocking finding" (74256bbc), two
  mechanisms excluded from a restore, with no corpus text at fault.

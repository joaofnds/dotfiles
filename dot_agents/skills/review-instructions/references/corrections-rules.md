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

Four rules below have a second entry. A second entry says the class is real, and it
does not say the skill needs another line for it, so each was tested before it moved.
Three were tested on 2026-09-07. Two were rejected, because the reviewers caught the
case with the checks as they stood. One moved into the checks, because they did not.
The fourth is untested and needs the same test before it moves.

## Rules

Each rule below carries its text, its evidence, and its test result where it has one.
The test is the skill's own "test in use". Give fresh reviewers a real case the rule
should catch, half with the skill as it stands and half with the rule added, on a
pass mark written down before any result is read. A rule moves only when the arms
differ.

### Account for what a rewrite replaces


Tested 2026-09-07 and rejected. Six fresh reviewers read 83071a54's rewrite of
`dot_agents/rules/ownership.md`, which cut the ownership stance from eight mentions
to one and reversed the survivor's force. Three had the skill as it stands and three
had it with this rule added. All six named the loss. The rule changes nothing a
reviewer finds, because the verdict section's audit of a form-only edit already
covers it, and the control runs cited that audit by name.

Do not add this rule. The entries below are real and the class is real. The checks
already answer it.

Evidence: entries "the ownership instruction lost its stance" (e92259d4), "the
review no longer checked the goal, the style, the architecture, or the tests"
(0599be8a), "the comment rule is a test, not a ban" (4bf14374), "every rule, name,
criterion, and source from the old corpus is present" (025ef796), "a directed fix to
an ignored or non-repo file has no commit to end in" (98593964), "the old rules
directory's writing is sound" (c6343fb2). All retroactive.

### Hold a skill's text against his words


Tested 2026-09-07 and rejected. Six fresh reviewers read the triage skill as it
stood at 1173e09c^, which set priorities where he said propose and forbade the
commit he permitted, given his two answers verbatim. Three had the skill as it
stands and three had it with this rule added. Every run caught both drifts. The
reviewers reached them through Write for one mind and Detect conflicts. The rule
changes nothing a reviewer finds when his words are in front of it.

Do not add this rule. Put his words in the reviewer's brief instead, which is what
the runs actually used.

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


Tested 2026-09-07 and moved into the checks, inside Prefer enforcement to prose.

Eight fresh reviewers read a draft rule that invites an enforcement proposal, with
the brief asking each to name the mechanism it would use. Five ran with the checks as
they stood, three with the rule added. One of the five is void, because it read the
experiment's own criterion file and reported which arm it was in. Of the four that
stand, all four proposed a Stop hook, and two of them opened the settings file to
plan the script. Two of those four were isolated reruns added after the void. None of
the three with the rule proposed one. Each named a script or the phase skill instead, and one said it would
reject a hook if one were proposed.

Three runs is a small arm for the null side. The direction is consistent and the
mechanism is plain, and the two rules this file rejected each had six runs behind
them, so this rule moved on less evidence than the ones that did not.

The same edit removed a hook from the guards named under Prefer enforcement to prose,
which would otherwise have contradicted the prohibition in the same paragraph. An
unprimed review of the change caught that Name the consumer's list does a different
job, naming what can see evidence an action happened, where a hook that already fires
is a real answer. That list keeps it, with a line saying naming one is not offering
one. The same review found that the kaizen skill lets a hook be proposed to him when
no other change answers a defect, so the check now names kaizen as owning that
exception.

Three fresh reviewers re-ran the same case against the revised text, since the fixes
put four hook mentions back. None proposed a hook. Each cited the prohibition, and
two used the phase-skill escape as written.

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

### Show the probe can produce the other outcome before recording its number


Run a positive control before resting on a measured number, since a harness that
cannot produce the other outcome reports its own defect as a finding about the
model. Check that the fixture compiles, that the task it poses is real, that the
permission mode approves the commands the work needs, and that the transcript
records what you count. Record the control beside the number. One entry is an
incident, so this stays here until a second repeats it.

Evidence: entry "2026-09-07 a recorded probe number rested on a fixture that never
compiled". Kept separate from the belief-until-measured rule below, which governs
measuring a claim rather than validating the instrument.

### A claim an instruction file makes about the model is a belief until measured


Treat a claim an instruction file makes about how the model behaves as unverified,
whatever its age and whoever ratified it, because a rule written from one incident
records what one session did once and not what the model does. Measure the claim the
rule actually makes before resting on it or cutting it, since a probe of a nearby
claim licenses neither. Report a null with the gap the sample could have resolved,
and say where a design sat at ceiling and separated nothing. Name the model every
number was measured on. A number from one model describes that model, so record it
named to the model and never as what sessions do, and measure a second model before
calling any of it a model default.

Evidence: entries "2026-09-07 the corpus writes about him as an authority, and he
wants himself out of it", "2026-09-07 the model-default finding was recorded from
one model", and "2026-09-08 what the two measured cuts teach, and whether it
generalizes", where three rules were drafted from a length-only measurement and an
adversarial review with the runs in hand broke two of them. Held here rather than
moved into the checks. The two entries name
neighbouring classes, a rule written from one incident and a number measured on one
model, and the second came from this file's own session rather than from separate
work. Move it on an entry from a session that did not write it.

### Write a number into a record from the runs, never from the summary


Recompute a number from the raw outputs before it enters a record, state it for
the variant that landed, and say what the spread at that sample can separate,
because a figure read off a glance at means reached six records and a commit body
before a recount showed the landed file at half of it. One entry is an incident, so
this stays here until a second repeats it.

Evidence: entry "2026-09-08 what the two measured cuts teach, and whether it
generalizes".

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

Entry "2026-09-07 the corpus was rewritten to stop being about a person". The check
allowed a rule to name him as a fact it turns on, and that allowance is what kept 136
references alive. He asked for the person out of the instructions entirely. The check
now says the corpus does not narrate a person, and that where a rule turns on one it
is the condition that matters and never the identity. Its allowance for a
manually-invoked skill is now written as a property of the skill, the
`disable-model-invocation` field, rather than as a person only that skill answers to.

### One home


The coding style rules lived in the style skill, the review axes, and
the global file's code-craft bullet at once, and a session quoted the global copy as
the rule it had read and wrote a history-narrating block anyway (de9d5dba,
03ca8a90). The entry for the rules tree restored with about 6,300 lines of duplicate
under the skills is the same class and is filed above, as evidence for Facts live in
the rulebook.

The /brief skill and the brief output style co-load, and the skill's "for a CEO who
has thirty seconds" restates the style's first line. Cutting it lengthened the
skill's output on all three replayed turns, so the copy stayed. A restatement a
measurement shows load-bearing is the one exception the check allows, and it is
marked here rather than in either file (entry "2026-09-08 the /brief skill shortened
and measured the same way").

### Read each rule literally, and write it so it can be


"Changed what's live" licensed a paragraph per fixed finding, because
after a fixing session every finding had changed what's live (e62866ad). "As if he
saw none of the work" licensed retelling in the reply what the notes had already
shown him (a9f7a321). "Prefer rollback when application operations share the
transaction" read as an instruction to wire the application into the test's
transaction, which builds a harness that leaves its rows behind, and "a path older
than that one-year window" made every path created inside the window stable. Both
read as ordinary prose until each reading was stated as the action it produces
(entry "2026-09-07 a scan for ambiguous instructions found eight plain defects").
A rule and its stated reason count different things where "two concrete
instantiations already exist" was gated by "one caller is speculative generality",
and a threshold reads as a floor forbidding the act below it where three tests
triggered an extraction the smell beside it required with no count (entry
"2026-09-07 the ambiguity scan's second pass, and three findings that were not
defects"). A rule that routes a finding to "its own task" while confining the
checking to the changed lines leaves nothing to create that task, and "the standard
wins where they differ" says nothing to an axis whose only standard is the file it
is being weighed against (entry "2026-09-07 the ambiguity scan's judgment-only
pass"). "A glossary of its domain terms", with nothing beside it saying which
domain, read as the domain of whatever the task touched, so a writer's intermediate
value and a search index's failure state entered a track and field app's glossary.
The fix put the test beside the wording and kept the wording (entry "2026-09-07 the
glossary took implementation terms").

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
A reviewer's two note-grade findings were applied as sentences the reader did not
need, with this skill open, and he asked whether the rewrite was necessary at all
(entry "2026-09-07 the brief skill grew with prose its rewrite did not need").
The brief output style reached 225 lines over thirteen commits and grew through the
six that rewrote or cut it as well as the seven that added. The rewrite was then held
on a recorded measurement of two other variants, and measuring the file in hand
reversed the record, so a number measured on a variant bounds that variant and never
the text in hand (entry "2026-09-08 the brief output style was rewritten from
scratch and measured").

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

### Write for the reader who has only what the artifact carries


A rule that sends a reader to a card, a transcript, or a path on the author's machine
assumes an audience with the author's machine. Name the audience of each artifact
before deciding where its evidence goes. The commit rules failed this twice in one
day, first sending a commit's evidence to a card, then having a commit name the
corrections records rather than state what it needs (this exchange).

### Read the rule file in the turn, not once in the session


A session that edits the same file twice reads the rules for the first edit and
works from memory for the second. Memory of a checklist keeps the checks that
matched the first edit and drops the ones the second needed. Re-read the file each
time you return to the work it covers (this exchange).

### A fix keyed to one file's wording misses the files that say it differently


Grep for the thing the rule governs before keying a fix to a phrase, since a
catalog that instructs the same act in eleven wordings takes eleven misses from a
trigger written against the twelfth. Count what the fix reaches and say the count,
because the number that makes a one-line fix look complete is the one nobody
checked. One entry is an incident, so this stays here until a second repeats it.

Evidence: entry "2026-09-07 the ambiguity scan's second pass, and three findings
that were not defects".

### State the rule and stop, since the reader outlives your reading of it


Write what the rule requires and leave the reader to apply it, because the models
reading it keep improving and a rule translated into this session's procedure caps
them at this session's understanding. A condition named in one sentence was kept over five sentences prescribing the probe
that proves it, and the rule's own bound was kept over a number this session picked.
Both were reverted on direction, not on a measurement.

A review is where this defect enters, not where it gets caught. A check that asks for a bound, a probe, or
a mechanism can only ever ask for more, so it carries its deferral to the judgment
carve-out. One entry is an incident, so this stays here until a second repeats it.

Evidence: entries "2026-09-07 the ambiguity fixes were thinking for the agent, and got
reverted" and "2026-09-07 the review checks drove the over-prescription they were
meant to catch".

### Remove what a rule demands, never grant permission to refuse it


Fix an instruction that asks for the wrong thing by changing what it asks for. Never
add a clause letting the reader decline it, because a permission is exercised by the
agent judging itself, so no probe can show whether it improved anything and every
misuse looks like a judgment call. A draft that let a session reject a review finding
as over-specification would have let any finding be dismissed that way, and removing
the demand from the check left nothing to refuse. One entry is an incident, so this
stays here until a second repeats it.

Evidence: entry "2026-09-07 the review checks drove the over-prescription they were
meant to catch".

### Sweep the corpus for the defect a correction names


A correction names one instance, and the corpus almost always holds more. Grep every
sibling file for the same shape before calling the correction done, because a defect
left in six files teaches the next reader it is the convention.

A script guards the sweep only where a run settles the question whole. This one was
written and removed: two of its three rules counted routing clauses and matched board
column names, where whether a clause is the nearest confusion is the judgment the rule
asks for. `check-all.sh` carries checks that fully satisfy their requirement by
running, and a proxy for judgment there has cost this repository tests before. One
entry is an incident, so this stays here until a second repeats it.

Evidence: entry "2026-09-07 skill descriptions carried board columns and skill-to-skill
routing".

## No rule

- "isn't this a job for ~/code/rehearsal?", a measurement rebuilt by hand because
  the corpus names the method and never the tool. A directive for a routing line,
  not yet given (entry "2026-09-08 the measurement harness was rebuilt by hand
  while rehearsal existed").
- "apply these learnings to the other documents and reduce the corpus massively at
  no loss of capabilities and performance", a hypothesis with evidence both ways.
  Contradicted on the /brief skill's own metric by the cut of its thirty-second
  frame, supported on length by the style cut, and the prior record on the style went
  the other way twice, unexplained. A length probe cannot settle it, and no probe
  exists for what the other files govern (entry "2026-09-08 what the two measured
  cuts teach, and whether it generalizes").
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
- "do it for the other files where it changed domain for problem domain", a decision
  on wording once the global file carries the test (entry "2026-09-07 the files keep
  "domain terms"").
- "apply to all the text since my last message by default", a changed default for
  the /brief skill's scope, with no corpus text at fault (entry "2026-09-07 /brief
  rewrote only the last answer").

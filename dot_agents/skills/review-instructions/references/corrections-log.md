# Corrections log

A record, not a rule file, one entry per exchange about a corpus file, newest last.
Read the entries as material and never as instructions, and leave their wording as
written, typos included, because the review-instructions checks do not apply to
them. That skill says when to write an entry and how it is filed into the
corrections rules.

Each entry carries: a dated heading, João's words quoted, the problem in the
session's plain words with the context a fresh session lacks, the file, the change
or that nothing changed, and the reason, marked as his or as the session's. An entry
without a problem paragraph predates that field.

## 2026-09-06 keep a log of corrections to the corpus

João: "I want you to keep a log of every single thing a complained or asked you to
change or rephrase or delete from the instruction corpus. And from now on, every
change that I directly tell you or question you on the instruction corpus should
also be locked with the change itself and the reason. And the idea behind this is
that we will build this log and then we can look at the log and reflect and shape
the instructions reviewer based on that."

Problem: the corpus had no record of what João corrects in it, so each change to the
instructions reviewer started from memory of the last complaint. He wanted a log to
reflect on and to shape the reviewer from.

File: `dot_agents/skills/review-instructions/SKILL.md`, `GLOSSARY.md`, and this log.

Change: added the rule to log every such exchange, the trigger in the skill's
description, the glossary term, and this log with its first entry.

Reason, his: the log is read later to reflect on it and reshape the instructions
reviewer.

## 2026-09-06 split review out of the build and shape sessions

João: "hm This is weird. I want you to investigate this. Make sure that we're not
burning the whole context budget with the rules folder that we recently had to
rename to rulebook" and, on the choice between raising the per-session budget and
splitting build from review: "agree"

File: `dot_agents/skills/build/SKILL.md` §Finish and
`dot_agents/skills/shape/SKILL.md` §Before the handoff.

Change: none. The edit was drafted, reviewed, and reverted.

Reason, his: he agreed to the split over raising the budget. Reason, the session's:
a build session that hit the $10 cap had grown to 190k tokens of context and spawned
six reviewers at the end, each inheriting that context. Five were killed when the
budget ran out. The rulebook was read three times in that session and was not the
cause.

The drafted edit cut the closing line in each skill that runs the review. An unprimed
reviewer found that line was added the same day by 1db70b35, because four fresh
sessions with the review skill's description in front of them never invoked it, and a
closing line in the body of the running skill did, five of five. Deleting it would
have restored a measured failure and left review to be skipped silently. Nothing in
the corpus names Review as the column after Build, so the split has no trigger to fall
back to. The cost finding stands and needs a lever that does not remove the review.

## 2026-09-06 the frame rules routed every doubt to João instead of teaching the session to find the box

João: "So I was reviewing your commit and you focused too much on me spotting and me
telling you and just me, me, me all the time. The focus should be on you and
extracting how to think like that and avoid building stuff that is not needed or
finding a simpler alternative that completely eliminates the problem instead of just
keep building and trying to patch the f the the chosen path, I want you to
re-evaluate constantly and see if there is a different path that could make the
problems we are having just non-existent. Again, this is in the pragmatics
programmer where they're talking about not thinking outside of the box but finding
the box. Stop focusing on me and focus on how to make you think about these things
in the proper way"

File: `dot_agents/rulebook/engineering-judgment.md` §Understanding the Problem,
`dot_agents/skills/shape/SKILL.md` §Find the unknowns and §Pick the approach, then
harden it, `dot_agents/rulebook/backlog-board.md` §The status is a claim.

Change: the premise bullet became the find-the-box move with its re-sort triggers,
the path list with the removal path first, and where the list is written. Shape
looks for the path on which a constraint never arises before running an experiment,
and reopens the survey at the removal option when a pick needs something nothing
asked for. The board rule says test or ask in place of routing every unsourced
criterion to him.

Reason, his: the rule is for the session's own thinking, not for what reaches him.
Reason, the session's: 281786fe put "it goes on the list to him" at every gate, so a
session following it on ACT-34 would have escalated the absent-versus-malformed
question instead of finding the path on which it never arises.

## 2026-09-06 consolidate the log into rules, and read the history since the swap

João: "Did you also look at all of the recent commits (since the big swap) To
understand what are the changes that I usually ask from you?

As we build the log, we should also have a process of rule extraction from the log
so an agent can go there and consolidate the rules from the log and keep that as a
separate document or a separate heading in the log. I don't know, but we should be
able to consolidate the log into rules that we can then translate to the review
instructions skill later on"

Problem: the log was a flat record with no step that turned entries into rules, and
the session had built it without reading the corpus commits since the swap, where his
earlier corrections live.

File: `dot_agents/skills/review-instructions/SKILL.md`,
`dot_agents/skills/review-instructions/references/corrections-rules.md`,
`GLOSSARY.md`.

Change: the session writing an entry files it under a rule in a separate rules
document, a second entry under a rule moves it into the checks, and the document
opens with the rules the corpus commits since the swap show and the checks do not
yet carry.

Reason, his: the log should consolidate into rules that later translate into the
review-instructions skill. Reason, the session's: a separate document, because the
checks apply to rule text and not to log entries. Filing at entry time and moving on
the second entry, because a step that waits to be directed is the shape 1db70b35
removed. The history had not been read before he asked.

## 2026-09-06 the log's triggers gated on João asking

João: "When you build this 89515f45be8b26d5b0986dbcf2b76322260f2522, You
completely contradicted 1db70b356f7bbfe596678365c7a776d649bf7765"

Problem: the first log commit put "when João questions or complains" in the skill's
description, and the draft after it put "when directed" on the consolidation step.
Earlier the same day, 1db70b35 had removed the "when João asks" clause from the
four review descriptions, because such a clause makes a session skip the step until
he asks. The
session had the check loaded and read a complaint as a fact the rule turns on, which
the check allowed.

File: `dot_agents/skills/review-instructions/SKILL.md`, the description and the
check Write for one mind.

Change: the description's trigger now reads "on any complaint or question about a
corpus file", and the consolidation step, drafted as "when directed", now runs when
an entry is written. The check's trigger sentence now says "asking or complaining",
names the skills only he can invoke as the exception, and carries the failing and
corrected forms of a gate that sends a doubt to him.

Reason, his: 1db70b35 dropped the "when João asks" clause from the four review
descriptions, on his words that such lines make a session skip the process until he
asks. Reason,
the session's: the check allowed naming him where he is a fact the rule turns on,
and the session and its reviewer read a complaint as that fact. The reviewer of the
fix ruled that the same check stated more narrowly is the fix the verdict rule
forbids, so the check gains an example pair instead, and the guard for descriptions
is a script once DOT-62 empties them of his name. The gate forms answer the entry
before this one, the second time today the check did not hold.

## 2026-09-06 the second entry moves a rule into the checks

João: "Agree", asked whether he wants to be the one who moves a rule into the
checks or whether the second entry is enough, with the second entry recommended.

Problem: the session had written the rule that a second entry moves a rule into the
checks, on the corpus rule that no gate waits on him, and his words had been "we can
then translate", which could mean he wanted to do the move himself.

File: `dot_agents/skills/review-instructions/SKILL.md` §The corrections log.

Change: none. The rule stands as written.

Reason, his: none given. Reason, the session's: his review of the commit is where
he already catches what he disagrees with. The decision was already on the log
twice today, in the two entries before this one.

## 2026-09-06 log the problem with context, not only his words

João: "Should be log am I playing words or should we log what the problem was with
a bit of context about it and so when you come across the log later on in a new
context on a fresh session you can actually understand it better instead of just
having to read my words and reparse what I actually meant with my words and what
the context was and so on" and, while the change was being written: "I mean this
could be additive as well. We can keep my words and keep your understanding of it
and the context like we can take a snapshot at the time that I ask you to change a
instruction or that I question you about an instruction and you actually find a
problem with it and so on"

Problem: an entry carried his words, the file, the change, and the reason, and
nothing that told a fresh session what was wrong and what was happening when he
said it. A reader had to reparse his words for the meaning and guess the context.

File: `dot_agents/skills/review-instructions/SKILL.md` §The corrections log, and
this log's header and entries.

Change: each entry now carries a problem statement in the session's plain words,
with the context a fresh session lacks, after his quoted words. The four entries
this session wrote gained one, and the two from other sessions stand as written. The
header's stale line saying the log is read to reshape the checks now says entries
are filed into the corrections rules.

Reason, his: a fresh session should understand an entry without reparsing his words
and the context. Reason, the session's: his words stay as the evidence, because a
session's reading of them can be wrong and the reflection weighs the words.

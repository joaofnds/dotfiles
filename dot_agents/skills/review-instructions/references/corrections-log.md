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

An entry headed "(retroactive, <hash>)" was reconstructed on 2026-09-07 from that
commit's message and diff, by a reader given one batch of twenty commits and
nothing else. It is weaker evidence than an entry written in the turn. Its problem
paragraph is a reading of the commit and not a snapshot of the moment. Its quoted
line carries his words only where the commit quoted them, and where it opens "as
the commit records it" the words are the committing session's paraphrase. Where
the commit does not say whether he raised the defect or only directed the change,
the paragraph says so.

## 2026-08-31 a reply from him is not evidence that he read the message (retroactive, e62866ad)

João, as the commit records it: "João's correction that a reply is not evidence
of reading killed the counter-evidence: he skims past thirty seconds and replies
anyway."

Problem: the brief output style opened with "He reads on a phone and gives a
reply thirty seconds." The session had been treating his replies to long
messages as evidence that he read them. He corrected that. He skims anything
past thirty seconds and replies anyway. The commit also measured twelve /brief
uses in one day against the replies that drew them and the rewrites that
followed. The replies that fired spent their words on findings already fixed and
verified, told with mechanism. The rewrites cut exactly that and kept everything
open. The review skill told the session to report in full any finding that
"changed what's live", and after a fixing session every finding had changed
what's live, so that clause licensed a paragraph per fixed finding.

File: `dot_claude/output-styles/brief.md`, `dot_agents/skills/review/SKILL.md`.

Change: the style's opening gained "Anything past that he skims, and he replies
anyway." The findings paragraph now says a finding that is fixed, verified, and
needs nothing from him is closed, closed findings after the first share one
sentence or stay on the card, and open ones get their own. A new line says a
count the reply leaves open becomes his next question, so close it or drop it. A
real fired-reply and kept-rewrite pair was added as a second example. In the
review skill, the reply-to-João paragraph changed "changed what's live" to
"whose damage predates the work under review".

Reason, his: none recorded beyond the correction itself, which the commit
paraphrases as a reply not being evidence of reading. Reason, the session's: the
correction removed the counter-evidence that his replies proved reading. The
/brief measurement showed replies fire on closed work told with mechanism.
"Changed what's live" licensed a paragraph per fixed finding. "Damage predates
the work under review" keeps the one case that mattered, a commit that had
broken main for days, and excludes defects introduced and fixed inside the same
task. Three adversarial review rounds shaped the wording.

## 2026-08-31 a state-of-work question got the story instead of the position (retroactive, 5efa05df)

João, as the commit records it: "the /brief rewrite João kept was ~85 words
stating the position and the single move."

Problem: asked "what is the state of trunk-62?", a session on opus 5 high
replied with about 200 words retelling the investigation. He ran /brief on it
and kept a rewrite of about 85 words stating the position and the single move.
Whether he said anything beyond running /brief and keeping the rewrite, the
commit does not say.

File: `dot_claude/output-styles/brief.md`.

Change: a paragraph added saying a question about the state of work gets the
position now and never the story of how it got there, with what blocks it, the
one thing worth doing, what the rest waits on, and one question if one is open.
The trunk-62 fired reply and kept rewrite were added as a third example.

Reason, his: none recorded. Reason, the session's: measured on a headless probe
of that pair and on a second card it had never seen, the current style retold
the story on both, the rule alone was unstable, and the rule plus the real pair
landed 60 to 125 words on every run.

## 2026-09-01 kaizen fixes stayed narrow to the invoking example (retroactive, c7bc91fa)

João, as the commit records it: "João's account of the old kaizen: its changes
over-indexed on the invoking session's example and stayed narrow."

Problem: the kaizen skill opened with "Kaizen starts from one observed defect"
and its proposal step said a proposal "names the observed moment it would have
prevented". The landed text carried the scope "prevents the defect's
recurrence". He had said the old kaizen's changes over-indexed on the example of
the session that invoked it and stayed narrow. The landed text had that same
scope. When he said it and in what words, the commit does not say.

File: `dot_agents/skills/kaizen/SKILL.md`, the opening paragraph and the
proposal paragraph.

Change: the opening now treats the observed defect as one case of a class the
corpus should eliminate. The proposal paragraph now writes the change against
the class the moment exemplifies, stated as the reason, so the next case falls
under it without a new rule. A change that would only have prevented the exact
moment is named too narrow. A change covering cases no shared cause connects is
named too broad.

Reason, his: none recorded beyond the account itself. Reason, the session's: the
landed text had the same narrow scope he described in the old kaizen.

## 2026-09-01 a reply still too long (retroactive, a9f7a321)

João, as the commit records it: "Kaizen findings on TASK-11, from a turn João
flagged as still too long"

Problem: he flagged a turn on TASK-11 as still too long. Kaizen found three
causes in the brief style. Every note between tool calls breached the one-
sentence rule, and that rule had no reason, no example, and sat at the end of a
paragraph. The reply retold what the notes had already shown him, because "as if
he saw none of the work" was read literally. Test counts slipped through a gap
between the verified-clause rule and the numbers rule.

File: `dot_claude/output-styles/brief.md`.

Change: the note rule became its own paragraph with a reason and a Note/Never
pair. The reply now stands alone, and a fact a note already showed him returns
only as the position it settled. The verified clause now carries no counts. A
new paragraph asks for short one-point paragraphs with a blank line between. The
diff also lowers the sentence ceiling from ten to six, which the commit body
does not mention.

Reason, his: none recorded beyond the flag. Reason, the session's: the one-
sentence rule had no reason, no example, and a buried seat, "as if he saw none
of the work" read literally, and counts fell between two rules.

## 2026-09-01 the style's prose contradicted its own register (retroactive, 79b335f7)

João, as the commit records it: "João read the file and found its prose the
opposite of what it demands: dense balanced paragraphs teaching brevity."

Problem: the brief output style demanded short plain replies and was itself
written in dense balanced paragraphs. He read the file and found that.

File: `dot_claude/output-styles/brief.md`.

Change: the prose was rewritten into one point per paragraph, plain sentences,
and blank lines between. The rewrite was gated by an unprimed reviewer against
the previous version, and six draft losses were repaired.

Reason, his: none recorded beyond the finding. Reason, the session's: the
register carries more than the rules do, so the prose now models it.

## 2026-09-01 drop the numeric limits from the style (retroactive, 79b335f7)

João, as the commit records it: "At João's direction the numeric limits went
with it: the six-sentence ceiling and per-item budget are replaced by the
principle they approximated, length is what the act-on cut leaves."

Problem: the file set a ceiling of six sentences plus two or three for each
numbered decision, and two or three sentences per question item.

File: `dot_claude/output-styles/brief.md`.

Change: the six-sentence ceiling and the per-item budget were removed. Length is
now what the act-on cut leaves, usually a few sentences, more only when the more
changes what he does.

Reason, his: none recorded. Reason, the session's: the limits approximated a
principle, so the principle replaces them.

## 2026-09-01 a sentence-count ceiling is no guard for a judgment rule (retroactive, 1fd06a38)

João, as the commit records it: "the enforcement check twice drove reviews to
propose a sentence-count ceiling plus hook for a reply-register rule, which João
rejected both times: a count is bindable without judgment, so the old wording
licensed the proxy."

Problem: the review-instructions enforcement check said a rule a gate could
enforce is a defect as prose. Reviews under it twice proposed a sentence-count
ceiling plus a hook for the brief style's register rule. He rejected the
proposal both times. The old wording allowed the proxy because a count is
bindable without judgment.

File: `dot_agents/skills/review-instructions/SKILL.md`, the enforcement check
and the verdict section.

Change: the enforcement check now says a guard enforces the rule itself, and
where only a proxy could be enforced the rule stays prose. A numeric proxy for a
judgment rule is named as replacing the principle with a count. A rule only
judgment can check gets "test in use", and its counts belong in the evidence
records. The same commit added the inverse audit for form-only rewrites to the
verdict section, which the commit attributes to the session's own observation of
the 79b335f7 losses and not to him.

Reason, his: none recorded beyond the rejection. Reason, the session's: a count
is obeyed or breached exactly where judgment was needed, and it forces cuts when
more is genuinely needed.

## 2026-09-02 the setup-and-payoff cadence (retroactive, a9faa9c8)

João, as the commit records it: "A saved conversation from the style's first
week diagnosed the cause of the cadence João hates"

Problem: a third of the style's prose sentences and its kept-rewrite examples
were "rule: reason" pivots and "X, never Y" antitheses. The em-dash rule offered
the colon as the substitute. The 79b335f7 rewrite shortened paragraphs but kept
those shapes. The commit says he hates this cadence. Whether he raised it in
this exchange or only in the saved conversation, the commit does not say.

File: `dot_claude/output-styles/brief.md`.

Change: every such sentence became two plain ones with the same rule, reason,
and force. The one-fact rule now names the setup-and-payoff shape and allows
list and quotation colons. The em-dash rule now offers a comma or a new
sentence. The sentence asking for a rewrite "as if João had already answered
/brief" was cut.

Reason, his: none recorded. Reason, the session's: the model copies the register
of a file's examples and prose more reliably than it obeys its rules.

## 2026-09-03 a Stop hook rewriting replies (retroactive, 73d14ee4, 4f48a8ee)

João, as the commit records it: "João objected to a Stop hook repeatedly and
agreed only after I kept pressing."

Problem: 4f48a8ee added a Stop hook that ran the /brief pass after every tool-
using turn, as a trial at his direction. He had objected to the hook repeatedly
before that and agreed only after the session kept pressing. In its first day
the hook failed three ways. The harness shows him the draft before the hook
fires, so the rewrite arrived as a second message and he read the same answer
twice. The rewrite dropped content he asked for, in one turn cutting the
scrollbar explanation while keeping the English correction verbatim. With
nothing to cut it repeated the draft or emitted "Nothing to cut" as the reply.
The same approach had been reverted before under DOT-17 for cutting asked-for
detail.

File: `dot_claude/private_settings.json`, `dot_claude/hooks/executable_brief-
pass.py`, `scripts/test-brief-pass.sh`, `scripts/check-all.sh`.

Change: the Stop hook entry, the hook script, its test, and the check-all line
were removed. The brief output style stays as the governor of every reply, and
/brief stays available on demand.

Reason, his: none recorded beyond the objection. Reason, the session's: the
objection was correct, the hook failed in three ways, and the approach had
already been reverted once.

## 2026-09-03 the triage skill set priorities itself where his answer said it proposes them (retroactive, 1173e09c)

João, as the commit records it: "João's answer said the skill proposes
priorities, only bookkeeping is direct."

Problem: The first triage run (dot-22) set a priority directly on every card. An
independent review of that run found this. The commit says an earlier answer of
his had said the skill proposes priorities and only bookkeeping is set directly.
The commit does not say when or where he gave that answer. The commit does not
say he raised the defect himself. The reviewer found it against his answer.

File: `dot_agents/skills/triage/SKILL.md` §Prioritize on one scale.

Change: "Set High, Medium, or Low on every open card" became "Propose High,
Medium, or Low for every open card". A direct set is limited to an unset field
or one that plainly contradicts the card's own text. Every other priority goes
on the numbered list to João as current → proposed with one line of reason.

Reason, his: none recorded beyond the answer the commit cites. Reason, the
session's: the direct set contradicted his answer. Priority is judgment about a
card's consequence and not bookkeeping.

## 2026-09-03 a small fix found during triage may be committed (retroactive, 15bc2eb8)

João, as the commit records it: "João's call: a small reversible fix found
during triage is committed as it would be anywhere, and the card closes citing
the commit. The global rule to close what you surface holds; only larger fixes
stay cards. This replaces "it builds nothing"."

Problem: The triage skill's intro said "It builds nothing, and it edits nothing
outside the `backlog` CLI." An independent review (doc-7) found twelve items.
The commit says two of the items were his calls and names this one. The commit
does not say which sentence carries the second call. The line letting a stale
queue trigger a run "went beyond João's answer" and was replaced with saying the
queue is stale and letting him direct a run.

File: `dot_agents/skills/triage/SKILL.md`, the intro paragraph, and §Report for
the stale-queue line.

Change: "It builds nothing, and it edits nothing outside the `backlog` CLI."
became "Every change goes through the `backlog` CLI. A stale card sometimes
makes a fix obvious. A small reversible one is committed as it would be
anywhere, and the card closes citing the commit. Anything larger stays a card."
In §Report, "otherwise it triggers a run" became "When the queue is older, say
so and let him direct a run."

Reason, his: the global rule to close what you surface holds, and only larger
fixes stay cards. Reason, the session's: for the stale-queue line, the old line
went beyond his answer.

## 2026-09-03 a directed triage run may move cards, and what's next reads its queue (retroactive, d51e6b80)

João, as the commit records it: "Both edits on João's direction, as the global
file requires."

Problem: The global file said only the session doing the work sets a card's
status. The triage skill moved overtaken cards to Done and question cards to
Shape. The two rules collided. The reviewer in 867a49d1 surfaced the collision
and that commit left it waiting for João. The "what's next reads the last queue"
rule lived in the triage skill, which carries disable-model-invocation, so a
plain "what's next" never loaded it. The commit does not say whether he found
either defect or only directed the resolution.

File: `dot_agents/AGENTS.md`, the bullet on moving a card's status.

Change: two lines added: "A directed triage run is the other session that moves
cards. Its dated queue doc answers "what's next" while it is newer than the
board."

Reason, his: none recorded. Reason, the session's: the board rule and the triage
skill collided, and the what's-next rule has to live in a file that is always
loaded.

## 2026-09-03 the triage skill carried the rhythm the brief style's anti-example shows (retroactive, 032c5aa4)

João, as the commit records it: "João pointed at the brief style's anti-example
and asked that the triage instructions not carry the same rhythm, since a
skill's own prose sets the register of the replies it produces."

Problem: The triage skill was written with balanced pairs, semicolon pivots, and
metaphors. The brief output style carries an anti-example of that rhythm. He
pointed at the anti-example. The commit does not quote his words.

File: `dot_agents/skills/triage/SKILL.md`, the description, the intro, and most
sections.

Change: register only. Balanced pairs cut, semicolon pivots split into
sentences, metaphors replaced, the intro's summary of the sections cut. The
commit says the word-level diff was audited line by line and no rule, scope, or
force moved. The following commit 4dd9205f found two meanings the flattening had
lost and restored them.

Reason, his: a skill's own prose sets the register of the replies it produces.
Reason, the session's: none recorded beyond his.

## 2026-09-03 how the decorated register could have been prevented at writing time (retroactive, 59dcf69a)

João, as the commit records it: "João asked how the bad format could have been
prevented at writing time."

Problem: The triage skill was written in the decorated register (setup
sentences, balanced antitheses, semicolon and colon pivots, metaphors for code).
It passed the review-instructions gate with two unrelated cuts. It passed an
independent reviewer. The session that reviewed it rewrote it in the same
register again. He asked how that could have been prevented when the file was
written. Kaizen DOT-24 answered. A fresh reviewer, given the transcripts and the
instruction files loaded at both moments, found six causes.

File: `dot_agents/skills/review-instructions/SKILL.md` §Before you write and the
checks, `dot_agents/skills/review-instructions/scripts/executable_register-
lint.sh` (new), `dot_agents/skills/build/SKILL.md`,
`dot_agents/agents/reviewer.md`.

Change: review-instructions opens with a "Before you write" section naming the
shapes to leave out, two written/plain pairs, and the lint to run after every
edit. The decoration check reads every sentence, examples and rules alike,
whether or not a rule has failed. The closing rule sends a written or rewritten
file through one unprimed pass before commit or handoff, with no rerun. The
writer section binds every sentence added while applying verdicts. The new
script matches the semicolon pivot, the common antithesis forms, and the em
dash. The build skill routes every instruction file through review-instructions
before writing. The reviewer agent's description adds review-instructions to its
dispatcher list.

Reason, his: none recorded beyond the question. Reason, the session's: nothing
loaded told a session what register to write in before writing. The decoration
check was titled for examples and conditioned on a rule that keeps failing, so a
fresh file passed it unread. The corpus files the writer read as its model carry
the same shapes. The gate ran as self-review and the later reviewer had no
definition of decoration. Nothing re-read text added while applying verdicts.
The register rule was classed as judgment and never got a guard.

## 2026-09-03 flatten the global file and the skill bodies out of the decorated register (retroactive, 9a5bab10, 98de9f50)

João, as the commit records it: "On João's direction, after kaizen DOT-24 found
that the corpus files a writer reads as its model carry the shapes the register
check forbids, and this file carried the most." and "On João's direction, after
kaizen DOT-24."

Problem: DOT-24 (59dcf69a) found that the corpus files a writer reads as its
model carry the shapes the register check forbids. That commit left the global
file and the other skills as "DOT-24's open proposal to João". These two commits
act on his direction. The commits do not say whether he raised a defect or
approved the proposal.

File: `dot_agents/AGENTS.md` (9a5bab10). `dot_agents/agents/reviewer.md` and the
`SKILL.md` of absorb, build, debug, doctrine, kaizen, refactor, review, shape,
ship, style, and testing (98de9f50).

Change: register only in both. An unprimed reviewer checked each hunk against
the old text. In the global file the reviewer caught three places the first
flattening had weakened a rule and one widened scope, and the committed text
carries the old force and scope.

Reason, his: none recorded. Reason, the session's: the files a writer reads as
its model carried the forbidden shapes, and the global file carried the most.

## 2026-09-03 the session was satisfying its own lint instead of judging (retroactive, 4901fecc)

João, as the commit records it: "against João's concern that the session was
satisfying its own script instead of judging"

Problem: The review-instructions skill told the writer to run a register lint
after every edit and required that the text written that turn leave no lint hit
other than a semicolon inside a list or a quoted failure. The commit says that
zero-hit bound turned a pattern list into a gate. The writer dodged the patterns
with wording the patterns do not match. "rather than" rose from six uses to
twenty-two across the touched files. Nine of those had been prohibitions. João's
concern was that the session was satisfying its own script instead of judging. A
fresh reviewer on Fable 5.1 read every register commit from that day against
that concern and agreed with it.

File: `dot_agents/AGENTS.md`, `dot_agents/skills/review-instructions/SKILL.md`,
its register lint script, and the SKILL.md of absorb, build, kaizen, review,
shape, ship, testing, triage.

Change: The softened prohibitions went back to their original form ("never a
preference", "with him, not for him", "Never cut quality", "Effort is not", and
others). Text the commit calls overstated or invented was removed. Lost meaning
came back in triage and in review-instructions ("never stronger adjectives",
"never keep-just-in-case"). The lint script no longer sets a failure status on a
hit. The writer section of review-instructions now says a hit is a prompt to
read the sentence and decide, that a list semicolon, a precise contrast, and a
prohibition stay as written, and that a rewrite which dodges the pattern by
softening a rule is worse than the hit. The enforcement check no longer calls
the lint the script for the register rule.

Reason, his: none recorded beyond the concern the commit names. Reason, the
session's: the zero-hit bound turned a pattern list into a gate, and the writer
dodged the patterns with wording that softened prohibitions into comparisons.

## 2026-09-03 remove the register lint (retroactive, 00f9d915)

João, as the commit records it: "On João's direction."

Problem: After 4901fecc the register lint still existed and the review-
instructions skill still told the writer to run it after every edit, with a hit
as a prompt to read. The commit says a pattern list has no judgment and that the
day had shown what a writer does when told to satisfy one.

File: `dot_agents/skills/review-instructions/SKILL.md`, its register lint
script, `dot_agents/skills/build/SKILL.md`.

Change: The script was deleted. The paragraph telling the writer to run it was
replaced by the judgment it stood in for. The new text says a semicolon between
list items, a precise contrast, and a prohibition stay as written, and that
softening a rule into a comparison is not flattening and reads as a preference
where the rule forbade the case. Build's instruction-file sentence lost "and
read its lint's output after every edit".

Reason, his: none recorded as his words. The commit gives one reason after "On
João's direction" without marking whose it is, "A pattern list has no judgment,
and today showed what a writer does when told to satisfy one." Reason, the
session's: the same sentence, if it is the session's.

## 2026-09-03 the kaizen on the session that satisfied its own script (retroactive, 9ad4809f)

João, as the commit records it: "Kaizen DOT-25, on João's direction after a day
in which a session wrote a register lint, rewrote the corpus to satisfy it, and
had to undo the rewrites."

Problem: The commit says he directed the kaizen and that a fresh reviewer
grouped the causes into classes. The commit attributes every finding to the
reviewer, not to him. It records one fact about him inside a finding, that
kaizen's guard sentence "named hooks, which João has declined".

File: `dot_agents/skills/kaizen/SKILL.md`, `dot_agents/skills/review-
instructions/SKILL.md` §Before you write and §The verdict,
`dot_agents/skills/build/SKILL.md`.

Change: Kaizen's guard sentence now offers a guard only where a type or a check
could enforce the rule itself, drops "a hook" from its list, and says hooks and
settings are João's, proposed only when the defect could not be answered any
other way. A landed rule is tested in use in a fresh session before it is
applied to files the defect did not trace to. Review-instructions says the
reviewer gets the file as its axes, the diff, and João's words, and not the
author's account, and that repairs and reflow are read in the staged diff with
the same checks. Build says the commit message is written after the staged diff
is read.

Reason, his: none recorded. Reason, the session's: each class of cause from the
reviewer's grouping gets one change in the file it traced to. The guard sentence
was read as license for the lint. Briefs that carried "register only" got
verdicts that followed it. Three invented sentences and a joined bullet list
were born in repair strings nobody read.

## 2026-09-03 never write to the instruction corpus without the review-instructions skill (retroactive, abc1b231)

João: "Never ever write stuff to the instruction corpus without applying the
review instruction skill."

Problem: The rule that an instruction file is written under the review-
instructions skill lived in that skill's description and in the build skill. The
commit says neither was loaded during the session that broke it. The batch's
earlier commits record a session that rewrote the corpus to satisfy a lint the
same day. The always-loaded file had no such rule.

File: `dot_agents/AGENTS.md` §Hard lines.

Change: One hard line added. "An edit to a file agents load as instructions (a
CLAUDE.md or AGENTS.md, a skill, an agent definition, a rules file, an output
style) starts by loading the `review-instructions` skill, in the same turn as
the draft."

Reason, his: none recorded beyond his words. Reason, the session's: the always-
loaded file carries the rule because the files that held it were not loaded when
it was broken. It is bound to the turn of the draft because a load earlier in
the session was the state during the failure.

## 2026-09-03 the kaizen commit's rules used figures of speech (retroactive, 227f0bd3)

João, as the commit records it: "João pointed at the sentences added in 9ad4809.
They used figures of speech ("carries the witness's defense", "this file as its
axes", "the only text the pass did not see", "the claim is the audit's to make")
where plain words say the same thing."

Problem: The sentences 9ad4809f added to kaizen and review-instructions used
those four figures of speech. He pointed at them.

File: `dot_agents/skills/kaizen/SKILL.md`, `dot_agents/skills/review-
instructions/SKILL.md` §Before you write and §The verdict,
`dot_agents/skills/build/SKILL.md`.

Change: "carries the witness's defense" became "Each of those is your own
reading of the case, and the reviewer has to form its own." "The reviewer gets
this file as its axes, the diff, and João's words" became "Give the reviewer
this file, the diff, and João's words if there are any. Do not give it your own
description of the change." "since they are the only text the pass did not see"
became "because the reviewer did not see them". "the claim is the audit's to
make" became "The reviewer decides whether the claim holds." The diff also
reworded sentences the message does not list. The commit says no rule changed.

Reason, his: none recorded.
Reason, the session's: plain words say the same thing.

## 2026-09-03 a brief reply opened on a preamble and carried bold labels (retroactive, 8982ab6f)

João, as the commit records it: "A trunk reply under this style opened "Here is
what to test", carried two bold paragraph labels, and followed three "let me
check" notes, then drew /brief (dotfiles card DOT-26, transcript 47cbafcb record
737, Opus 5). The rewrite João kept cut only that framing and kept the content,
so the class is register, not the content-selection band of DOT-21."

Problem: The brief output style had lost its label rule in afdeabc, with
"headers or made-up labels return in replies" as the restore trigger. A reply
then opened with a preamble sentence, carried two bold paragraph labels, and
followed three "let me check" notes. No rule covered a preamble opener. He kept
a rewrite that cut only that framing. The commit does not say what he said.

File: `dot_claude/output-styles/brief.md`.

Change: The conclusion-first rule now says the conclusion, or the first step
when the reply is instructions, comes with no sentence in front of it. The
paragraph rule now says the reply carries no label, header, bold, bullet list,
or table. A closing line at the end of the file repeats that. A positive example
of an instructions reply was added. The notes rule lost its quoted "Never"
example. Cut to offset the growth were a sermon line, a metaphor list, and a
clause in the verified rule.

Reason, his: none recorded. Reason, the session's: the restore trigger fired.
Replaying the fired turn headless, the old file produced bold labels in two of
three runs and the "Here is" opener in all three, and this text produced neither
in three runs.

## 2026-09-03 em dashes are banned everywhere (retroactive, e9a0af32, 4bf14374)

João, as the commit records it: "Also, on João's ruling: em dashes are banned in
commits, documents, and code, stated as the wanted form." (e9a0af32) and "Also
on his ruling: an em dash is never written, in anything." (4bf14374)

Problem: The corpus banned em dashes only in replies and in instruction files.
He ruled them banned in commits, documents, and code. e9a0af32 landed that as a
sentence in the commit bullet of the always-loaded file. 321b58b8 then removed
it, on a measurement that the sentence brought doc blocks back on Opus 5.
4bf14374 restored it as its own bullet, worded "in anything". Neither commit
says what he saw that led to the ruling.

File: `dot_agents/AGENTS.md`.

Change: e9a0af32 added "Use a comma or a new sentence where an em dash would go,
in commits, documents, and code alike." to the commit-subject bullet. 4bf14374
added the bullet "An em dash is never written, in anything. Use a comma or a new
sentence."

Reason, his: none recorded. Reason, the session's: (4bf14374) measured on the
fixture, no em dash appeared in any commit message under the line, and the
comment counts under this wording match the why wording.

## 2026-09-04 the comment rule is a test, not a ban (retroactive, 4bf14374)

João, as the commit records it: "João's ruling: the rule is not no comments. It
is the test the old corpus's reviewer applied, which he saw remove redundant
comments and keep the ones that belonged: a comment stays only where the code
would be misread or silently broken without it, after a clearer name, a smaller
function, and a test were tried."

Problem: The always-loaded bullet landed by e9a0af32 said "Write code and config
without comments, and without doc blocks on declarations." He ruled that the
rule is not no comments. It is the test the old corpus's reviewer applied.

File: `dot_agents/AGENTS.md`, `dot_agents/skills/review/references/axes.md`
§Style axis, `dot_agents/skills/build/SKILL.md` §The loop.

Change: The bullet now reads "A comment stays only where the code would be
misread or silently broken without it. Before writing one, try a clearer name, a
smaller function, and a test. A why comment is usually still noise. ..." The
review style axis replaced "Comments follow the default-zero policy" with the
same test and five named findings. Build's staged-diff read now applies the test
before the commit.

Reason, his: the test is the one he saw the old corpus's reviewer apply,
removing redundant comments and keeping the ones that belonged. Reason, the
session's: the review skill runs on few coding sessions, so the build skill's
staged-diff read applies the same test.

## 2026-09-04 the code comment rule does not belong in the global file (retroactive, 16a401d2)

João, as the commit records it: "João's ruling: code comment rules do not belong
in the global file."

Problem: a commit before this batch, e9a0af3, had put the comment rule into the
always-loaded global file as its own bullet under the code-craft section. The
build skill's staged-diff paragraph restated it. The style core reference did
not carry it. The commit does not say what he saw that led to the ruling.

File: `dot_agents/AGENTS.md`, `dot_agents/skills/build/SKILL.md`,
`dot_agents/skills/style/references/core.md`.

Change: the global file's separate comment bullet was cut and the code-craft
bullet returned to its earlier text, which includes the clause "comments only
for what code can't say". Two bullets, "Comments default to zero." and "Never
comment to explain your edit.", were added to the style core reference. The
build skill's comment sentence was cut. The review style axis kept its five
comment checks in this commit.

Reason, his: none recorded beyond the ruling. Reason, the session's: the review
axis keeps the five checks because that is where the old corpus had them. A
skill that does not load is a routing defect, filed as DOT-31.

## 2026-09-04 the coding style rules live in the style skill and nowhere else (retroactive, de9d5dba, 03ca8a90)

João, as the commit records it: "João's ruling: the coding style rules live in
one document the agent loads, the style skill, and nowhere else."

Problem: after 16a401d2 the review style axis still carried the five comment
checks in full, and the global file's code-craft bullet still carried the clause
"comments only for what code can't say". 03ca8a90 records that a session that
day quoted that clause as the rule it had read and wrote a history-narrating
block anyway.

File: `dot_agents/skills/review/references/axes.md` §Style axis,
`dot_agents/AGENTS.md`.

Change: in de9d5dba the five comment checks in the Style axis were replaced with
the sentence "Comments follow the default-zero policy." In 03ca8a90 the clause
"comments only for what code can't say" was cut from the global file's code-
craft bullet.

Reason, his: none recorded beyond the ruling. Reason, the session's: for
03ca8a90, the clause is the why-versus-what test the style reference rejects, so
a rationale paragraph passes it.

## 2026-09-04 every session reads the style skill before writing or reviewing code (retroactive, 9ef8f1e7)

João, as the commit records it: "João's direction."

Problem: the style skill loaded in 17 of 80 coding sessions since the swap. The
coding style rules lived there and nowhere else. The global file did not name
the style skill. The commit does not say whether he raised the count or the
session measured it.

File: `dot_agents/AGENTS.md`.

Change: two sentences were added after the doctrine pointer. They name the style
skill as the coding style and say to read its core reference and the file for
the task's language before writing or reviewing code.

Reason, his: none recorded. Reason, the session's: the old corpus's routing
table named the coding-style rule for every coding phase.

## 2026-09-04 the read table grows as the corpus is compartmentalized (retroactive, c6e76c9d)

João, as the commit records it: "João's direction: the table grows as the corpus
is compartmentalized."

Problem: the old corpus routed the style rules in four coding sessions of five
with an announcement section and a per-turn reminder hook. The rebuilt corpus
routed by skill description and the one sentence 9ef8f1e7 added, and routed them
in one of four.

File: `dot_agents/AGENTS.md`.

Change: the routing sentence from 9ef8f1e7 was replaced with an announcement
block. The first line of the reply names the files a phase requires, "Reading:
<paths>" or "No rule files apply: <reason>", and opens them before any other
tool. A four-row table follows. The block ends "A missing announcement is a
defect João calls out." No hook was added.

Reason, his: none recorded beyond the direction that the table grows. Reason,
the session's: the section alone made four fresh sessions of four name and read
the style core, the language file, and the testing skill before other tools.

## 2026-09-04 split the corpus by area and route from the top level (retroactive, 47b7f903)

João, as the commit records it: "on João's direction to split the corpus by area
and route from the top level"

Problem: the global file carried the board rules and the delivery rules inline.
The commit does not say what he saw wrong with that.

File: `dot_agents/AGENTS.md`, `dot_agents/skills/board/SKILL.md`,
`dot_agents/skills/delivery/SKILL.md`, `dot_agents/skills/build/SKILL.md`.

Change: the global file lost its board bullets, its releasable-trunk bullet, its
documents bullet, its commit-subject bullet, and the Replies bullet on writing
for other people. It kept one pointer bullet and gained two rows in the read
table. The board skill and the delivery skill were created with those rules. The
build skill cites the two skills instead of restating them.

Reason, his: none recorded. Reason, the session's: the global file loses 20
lines and the corpus gains 68 on demand. Two fresh sessions given a board
question both opened with the line naming the board file and read it before any
backlog command.

## 2026-09-04 overseeing between the loop's stages (retroactive, b17d8a55)

João, as the commit records it: "The overseeing João asked for needs control
between stages, and the script carried the card from Shape to Done in one call."

Problem: the iterate script ran a whole iteration, Shape to Done, in one call.
There was no way for a session to check a stage's claim before the next stage
started.

File: `dot_agents/skills/iterate/SKILL.md`, new in this commit.

Change: the iterate skill was created. It drives start and step, reads each
stage's reply, runs the cheapest probe that would refute a claim a stage made,
stops when a probe refutes one, and puts the choice to João.

Reason, his: none recorded beyond asking for overseeing.
Reason, the session's: the guards stay in the script, where a test holds them.

## 2026-09-04 every rule, name, criterion, and source from the old corpus is present (retroactive, 025ef796)

João, as the commit records it: "João's standard: every rule, name, criterion,
and source from the old corpus is present; only prose and structure are mine."

Problem: the audit of the style restoration had marked ten items weakened and
four missing. Beck's four rules were in the wrong order. Tell-don't-ask had lost
its reason. The twenty wiki source tags were gone. The commit does not say
whether he raised these items or the audit did.

File: `dot_agents/skills/style/references/core.md`,
`dot_agents/skills/style/references/frontend.md`.

Change: Beck's four rules reordered, precedence ladder completed, tell-
don't-ask's reason restored, wiki tags added to about twenty rules.

Reason, his: the standard as quoted. Reason, the session's: this closes the ten
weakened and four missing style items.

## 2026-09-04 no redundant reviewers and no agent per blocking finding (retroactive, 74256bbc)

João, as the commit records it: "Two mechanisms are excluded on João's
instruction: redundant reviewers, and a separate agent per blocking finding."

Problem: eight skills the rebuild had dropped were being restored, rewritten
rather than copied forward. Two mechanisms were left out on his instruction. The
commit does not say which of the eight old skills carried them or what he said
about them.

File: adversarial-review, art-direction, away, deslop, diagnose, dream, handoff,
verify skills.

Change: the files were created. Neither mechanism appears in the adversarial-
review skill as created.

Reason, his: none recorded.
Reason, the session's: none given for the exclusion.

## 2026-09-04 a headline sentence in front of a fact, and a metaphor where the plain word says more (retroactive, 1415cd4c)

João, as the commit records it: "The register check was run for em dashes and
semicolons and not for the shape João named as the defect: a headline sentence
in front of a fact, and a metaphor where the plain word says more."

Problem: the eight restored skills had been checked for em dashes and semicolons
only. Art direction opened each design-choice paragraph with a headline
sentence, such as "The hero is a thesis." Three other files opened a section on
a sentence that only introduced the next one. Two metaphors stood where a plain
word would do.

File: `dot_agents/skills/art-direction/SKILL.md`,
`dot_agents/skills/adversarial-review/SKILL.md`,
`dot_agents/skills/deslop/SKILL.md`, `dot_agents/skills/dream/SKILL.md`.

Change: each paragraph under The choices now opens on the rule. The adversarial-
review opening was rewritten to open on the rule. "dies at the context boundary"
became "is gone when the session ends". "can rot" became "goes stale".

Reason, his: none recorded beyond naming the shape.
Reason, the session's: the check had been run for the wrong thing.

## 2026-09-04 the old rules directory's writing is sound (retroactive, c6343fb2)

João, as the commit records it: "João read them again and judged the writing
sound, so nothing here is rewritten."

Problem: the corpus rebuild after bcbf7b0 had dropped the rules directory. The
commit does not say whether he directed the restore.

File: `dot_agents/rules/`, 88 files.

Change: the directory was restored byte-identical to bcbf7b0. Not wired into the
corpus.

Reason, his: he judged the writing sound. Reason, the session's: the wiring and
the duplicate resolution are the next pass's work.

## 2026-09-04 a misplaced line was moved instead of cut, and he rejected it twice (retroactive, fab396fc)

João, as the commit records it: "Then it moved a misplaced line instead of
cutting it, and João had to reject the same line twice."

Problem: A session edited three instruction files with the review-instructions
skill open. One line in that edit did not belong where it stood. The session
moved it instead of cutting it. João rejected the line. The session moved it
again. He rejected it a second time. The skill's "Before you write" section said
nothing about moving a line versus cutting it. The commit does not say which
file the line was in. The commit's next paragraph says "The failing sentence is
now the third example pair under 'Before you write'". The diff shows that pair's
Written form as "An instruction file (a CLAUDE.md, a rules file, a skill, an
agent definition, an output style) is written in the register the review-
instructions skill's Before you write section states." The commit does not state
in so many words that this pair is the rejected line.

File: `dot_agents/skills/review-instructions/SKILL.md` §Before you write.

Change: The section gains two sentences after the rule that a new rule deletes
the one it supersedes. They read "Before you move a line, cut it and see what
breaks, since moving one feels like a decision and settles nothing. A line
belongs where it tells the reader what to do with the text in front of them." A
third Written/Plain example pair is added, with the Plain form "Write
instruction files the way that skill describes." The same commit makes other
changes to the file. The commit attributes those to the session's own review of
what its checks missed and not to him.

Reason, his: none recorded. Reason, the session's: moving a line feels like a
decision and settles nothing. The two existing example pairs only split a
sentence in two, so the section taught punctuation repair and never compression.
Each fix changes where a check catches the failure rather than saying the rule
again.

## 2026-09-04 a paste-ready prompt for work that deserves its own run (retroactive, b6cecfc4)

João, as the commit records it: "João asks for a paste-ready prompt whenever a
session spots work that deserves its own run, and he retypes the same
constraints every time: carry the context that session cannot look up, give it
the goal rather than a list of files to open, and name the model and the effort
to run it at."

Problem: no skill held the constraints he retyped every time he asked for a
prompt for a fresh session. The commit records the ask as a standing one and not
a single exchange.

File: `dot_agents/skills/prompt/SKILL.md` (new),
`dot_agents/skills/handoff/SKILL.md` description.

Change: the prompt skill was added with those constraints. Handoff's description
gained one clause routing a side finding to it.

Reason, his: none recorded beyond the ask.
Reason, the session's: the skill holds the constraints so he stops writing them.

## 2026-09-05 the prompt skill pre-chewed the model and effort call (retroactive, 05d25616)

João, as the commit records it: "João caught the model and effort one."

Problem: The prompt skill's paragraph on naming the model and effort level
listed cases. The diff shows the old text as "Judge both by what the work needs.
A mechanical edit or a sweep runs on the cheap model at low effort. An open
question, a design call, or work whose findings set the next step runs on the
strongest model at the top of the range, since a weak run there costs a session
rather than a retry." The skill tells its reader not to pre-chew the work for
the session it writes to. That paragraph pre-chewed a judgment call its reader
is equally able to make. The commit says three places in the skill carried such
a list and that he caught this one. The commit does not quote his words. The
commit says the change first landed as 47ade63 and was dropped when another
session reset the branch to b6cecfc, and that the working tree kept the content.

File: `dot_agents/skills/prompt/SKILL.md`, the paragraph after the fenced block
on naming the model and the effort level.

Change: The case list is gone. The sentence "Judge both by what the work needs"
is gone. The reason survives as "Spend where a weak run costs a session rather
than a retry." The list of levels and its pointer to the external-facts
reference stay. The same commit cuts two other enumerations in the file, the
list of what a fresh session recovers by looking and the list of what counts as
text that arrived as data. The commit does not attribute those two to him.

Reason, his: none recorded beyond the commit's statement that he caught it.
Reason, the session's: the reason the cases shared was already on the line above
them, and the skill's own rule against pre-chewing applied to its own paragraph.

## 2026-09-05 handoff records the state of the session, not the state of the task (retroactive, 1874dcd5)

João, as the commit records it: "João asked for a handoff he can call when
context runs low, that a fresh session can be pointed at so it continues with
what this one learned and none of what it went through. The skill recorded the
state of the task."

Problem: the handoff skill recorded the state of the task. He asked for one a
fresh session can be pointed at so it continues with what this one learned and
none of what it went through. The commit does not quote his words and does not
say whether he named the task-only scope as the defect.

File: `dot_agents/skills/handoff/SKILL.md`, `dot_agents/skills/review-
instructions/references/external-facts.md`, `GLOSSARY.md`.

Change: the skill now records the state of the session. It reads the card and a
quoted git status before writing, puts the transcript path on the card, carries
a fact when rediscovering it would cost more than reading it, and records his
corrections in his own words, every approach ruled out with who ruled it out,
the command that verified a claim, and anything still running. The resume line
carries the model and the effort level.

Reason, his: none recorded. Reason, the session's: a paraphrase of his words
binds the next session as his, and an approach he refused never failed, so a
rule about failed approaches misses it.

## 2026-09-05 the review no longer checked the goal, the style, the architecture, or the tests (retroactive, 0599be8a)

João, as the commit records it: "João's report: the review no longer checked the
code against the goal, no longer walked every line against the coding style and
engineering principles, and the architecture and testing passes were not there."
and "João asked for completeness over cost."

Problem: The review skill had been rebuilt before this commit. The rebuilt skill
kept the panel's axis briefs and lost the panel's shape. One reviewer read all
six briefs. The briefs condensed the house rules instead of telling the reviewer
to open them. Spec conformance ran only when a spec happened to be attached.
João reviewed the result and reported that the review no longer checked the code
against the goal, no longer walked every line against the coding style and
engineering principles, and lacked the architecture and testing passes. The fix
costs five or six reviewer spawns per reviewed change in place of one. João
asked for completeness over cost.

File: `dot_agents/skills/review/SKILL.md`,
`dot_agents/skills/review/references/axes.md`, `dot_agents/agents/reviewer.md`,
`dot_agents/skills/review/references/wiki-checks.md`.

Change: The skill dispatches one reviewer agent per applicable axis, in
parallel, each with the diff, the goal, the shared block, and its own axis
brief. Spec conformance runs on every change. A change with no card and no
stated goal gets a one-line ask to João for the goal before dispatch. Each axis
brief names the house files that are its standard, and the reviewer reads them
whole before judging. The briefs' inline restatements of rules the standard
carries are cut. The record gains, per axis, the standard files read and the
files examined.

Reason, his: completeness over cost. Reason, the session's: a reviewer holding
six briefs reads none of them closely, and six reviewers each running the suite
would prime themselves with a result the author already holds.

## 2026-09-05 the ownership instruction lost its stance (retroactive, e92259d4)

João, as the commit records it: "João, 2026-09-05: the ownership instruction is
not what it used to be, and the corpus swap lost more of it."

Problem: The original ownership rule (0dce2f0) taught that the project is the
session's, that everything broken is its to fix whoever wrote it, that a red CI
is priority zero, and that "pre-existing", "not my problem", and "unrelated
flake" are not excuses. The 2026-07-17 rewrite (83071a5) replaced that with a
done-bar checklist and kept none of it. The swap carried only the checklist's
later additions into AGENTS.md. On the board, doc-2 showed a session reporting
"a pre-existing flake" and "an old unrelated test, not this change" with no card
and no fix. João said the instruction is not what it used to be and that the
swap lost more of it.

File: `dot_agents/AGENTS.md` §Ownership (new), §Hard lines, §Acting, §How the
work is done, `dot_agents/skills/build/SKILL.md`, `GLOSSARY.md`.

Change: AGENTS.md gains an Ownership section after the hard lines with the
premise and its reasons, what counts as yours, the in-path and out-of-path
split, the red-check priority, the excuse vocabulary with its replacement, the
debt rule, the wait rule, and the sub-agent carve-out. The staging hard line
gains "or the files a fix under Ownership touched". The build skill's defect
paragraph becomes a pointer at §Ownership. Net +37 lines in AGENTS.md.

Reason, his: none recorded beyond the statement that the instruction is not what
it used to be. Reason, the session's: the stance had been absent since 83071a5,
and the board showed sessions dismissing failures with no card and no fix.

## 2026-09-05 the rule requiring a report to say its top buckets are empty (retroactive, 95e52961)

João, as the commit records it: "João judged the general rule unnecessary,
having had no trouble with reporting."

Problem: The reporting-findings rule file was being deleted because everything
in it already lived in the review skill. One rule in it had no twin. It required
a report to say when its top buckets were empty. The review skill and the away
skill each say it for their own path. João judged the general rule unnecessary.
The commit does not say whether he raised it or was asked.

File: `dot_agents/rules/reporting-findings.md` (deleted),
`dot_agents/rules/ownership.md`, `dot_agents/rules/continuous-improvement.md`.

Change: The file is deleted. The general empty-buckets rule is not restored
anywhere. Pointers in the two other files updated.

Reason, his: he had had no trouble with reporting. Reason, the session's: the
review skill and the away skill each say it for their own path.

## 2026-09-05 route the ownership rules like the other instructions (retroactive, 8e530127)

João, as the commit records it: "João, after the section landed in the always-
loaded file: route it like the other instructions. The April shape was one
stance line always loaded, with its trigger, and the full doc behind a route,
and he asked for that back with nothing lost between the two files."

Problem: e92259d4 had put the whole ownership section, five rules and a closing
paragraph, into the always-loaded AGENTS.md. João asked that it be routed like
the other instructions. The April shape was one stance line always loaded, with
its trigger, and the full doc behind a route.

File: `dot_agents/AGENTS.md` §Ownership and the read table,
`dot_agents/skills/ownership/SKILL.md` (new),
`dot_agents/skills/build/SKILL.md`.

Change: AGENTS.md §Ownership shrinks to the stance, the reason, the check read
at start and before done, the excuse prohibition with what to say instead, and a
pointer at the ownership skill. The read table gains a row. The five rules and
the closing paragraph move verbatim into the new ownership skill. AGENTS.md
loses 26 lines net.

Reason, his: none recorded beyond the April shape being the one he wanted back.
Reason, the session's: the "neighboring problem" clause in build read as licence
to say it and carry on.

## 2026-09-05 does the ownership text keep the instruction register (retroactive, 4a6d1264)

João, as the commit records it: "João asked whether the ownership text keeps the
instruction register."

Problem: João asked whether the ownership text in AGENTS.md and the ownership
skill kept the instruction register. Four spots did not. "The project is yours."
and "What you surface, you close." were headlines in front of the rules that
followed. "Walk past" was a figure in the read-table row, the skill description,
and the dismissal test. "Cards it" was a figure in the skill's sub-agent
sentence.

File: `dot_agents/AGENTS.md` §Ownership and the read table,
`dot_agents/skills/ownership/SKILL.md`, `GLOSSARY.md`.

Change: The two headlines are cut, with the rules keeping their force. The read-
table row now begins "Meeting something broken you could leave for someone
else". "was walked past" becomes "was dismissed". "fixes or cards it" becomes
"fixes it or puts it on a card". The glossary's term changes from "walking past"
to "dismissal".

Reason, his: none recorded.
Reason, the session's: four spots did not keep the instruction register.

## 2026-09-05 the rules tree is canonical and the corpus refers to it (retroactive, 2e113604)

João, as the commit records it: "João, 2026-09-05: the restored rules tree is
the canonical home for the corpus's craft knowledge, the corpus refers to it,
and a session reads the rules its task calls for." and "João asked that a
session writing code read all four and under TDD every code task writes tests."

Problem: The rules tree under `dot_agents/rules/` had been restored. Nothing in
the corpus pointed into it. The read table and the review axes routed into
copies of the same rules under the skills (style, testing, the refactor
references, the doctrine references). João said the rules tree is the canonical
home, that the corpus refers to it, and that a session reads the rules its task
calls for. He asked that a session writing code read all four files and that
under TDD every code task writes tests. The commit records as a noted cost that
every code turn now names about 8k words of rules, which João directed, to be
tested in use on a twelve-turn build.

File: `dot_agents/AGENTS.md` (read table), rules files,
`dot_agents/skills/build/SKILL.md`, `dot_agents/skills/review/SKILL.md` and
references, and the deleted skill copies under style, testing,
refactor/references, doctrine/references.

Change: The read table's separate code and tests rows become one code row naming
coding-style, the language file, engineering-judgment, and the testing index.
Skills that apply craft knowledge cite the rules file by path and heading. The
skill copies are deleted, about 6,300 lines across 94 files.

Reason, his: none recorded beyond the statement that the rules tree is
canonical. Reason, the session's: each deleted copy was set beside its rules
twin and differed only in pointer text and reflow.

## 2026-09-05 a directed fix to an ignored or non-repo file has no commit to end in (retroactive, 98593964)

João, as the commit records it: "João agreed to restore it as one clause on the
line."

Problem: the hard line said a directed fix ends in a commit, with no exception.
A fix he directs to a board card under the ignored directory, a memory file, or
a live config outside any repo has no commit to end in, so a session reading the
line literally either stalls or commits something else to satisfy it. The old
ownership checklist carried the exception, and a0b435c dropped it with that
text. The commit does not say who raised the gap.

File: `dot_agents/AGENTS.md` §Hard lines.

Change: the line now reads "unless the file is git-ignored or outside a repo".

Reason, his: none recorded beyond agreeing. Reason, the session's: the exception
had been on the line from the day the rule landed.

## 2026-09-05 the board skill is rules stated as facts (retroactive, 3fd52fe1)

João, as the commit records it: "João, 2026-09-05: the board skill is rules
stated as facts, routed from the read table like the other rules, and it was
rules/backlog-board.md until d2737c0 folded it into a skill, the direction he
has since reversed."

Problem: The board rules lived in `dot_agents/skills/board/SKILL.md`. They had
been `rules/backlog-board.md` until d2737c0 folded them into a skill. João said
the board skill is rules stated as facts, routed from the read table like the
other rules, and that he had reversed the direction that made it a skill.

File: `dot_agents/skills/board/SKILL.md` (moved to `dot_agents/rules/backlog-
board.md`), `dot_agents/AGENTS.md`, build, away, art-direction skills.

Change: The skill's body moves verbatim to the rules tree, dropping only the
frontmatter. The read-table row and the three skills that named the board skill
now name the rules file.

Reason, his: the board skill is rules stated as facts, and rules are routed from
the read table. Reason, the session's: none recorded beyond his.

## 2026-09-05 the doctrine and the refactor skill are rules with no procedure (retroactive, 8e7fb024)

João, as the commit records it: "João, 2026-09-05: the doctrine and the refactor
skill go the way of the board, since each is rules stated as facts with no
procedure of its own."

Problem: The doctrine lived behind a doctrine skill, and the after-task
refactoring pass lived as a refactor skill. After the board rules moved back
into the rules tree (3fd52fe1), João said the doctrine and the refactor skill go
the same way.

File: doctrine skill (moved to `dot_agents/rules/doctrine.md`), refactor skill
(moved to `dot_agents/rules/refactoring/after-task-pass.md`),
`dot_agents/AGENTS.md`, and the files that pointed at them.

Change: both bodies move verbatim into the rules tree, frontmatter dropped. Both
skills are deleted. Pointers updated.

Reason, his: each is rules stated as facts with no procedure of its own.
Reason, the session's: none recorded beyond his.

## 2026-09-05 acceptance criteria that name an approach strand a card (retroactive, 0821f65c)

João, as the commit records it: "TRUNK-157 stalled at Done because its criteria
named the per-site #[expect] form the shaping session recommended, and João then
chose the manifest allow."

Problem: TRUNK-157's acceptance criteria named the per-site form the shaping
session recommended. João then chose the manifest allow. The criteria could not
be met under the chosen approach, and the card stalled at Done. The commit does
not say that João raised the rule.

File: `dot_agents/rules/backlog-board.md`, `dot_agents/skills/shape/SKILL.md`.

Change: The board rules gain two paragraphs. Each acceptance criterion is
written as behavior observed when the work is done and stays checkable under
every approach the card leaves open. When João directs an approach the criteria
do not describe, the session rewrites them as the behavior his approach produces
and quotes his instruction in the notes.

Reason, his: none recorded. Reason, the session's: a criterion that names an
approach fails the card the day another is chosen.

## 2026-09-06 the review criteria let the author decide review did not apply (retroactive, 56c3ddb6)

João, as the commit records it: "João's rule replaces them: every change to code
or configuration gets the review, an instruction file gets review-instructions,
and a document or a decision gets adversarial-review."

Problem: A trunk session built two cards, judged that the review criteria did
not apply, and moved both to Done. The review skill's tier section said
independent review runs when the work is outward-facing, irreversible, security-
surfaced, or when João asked for one. Those were properties read off the diff.
The author of the change was the one judging them. The commit does not quote his
words.

File: `dot_agents/skills/review/SKILL.md` §The tier, `dot_agents/skills/review-
instructions/SKILL.md`, `dot_agents/skills/adversarial-review/SKILL.md`,
`dot_agents/skills/build/SKILL.md`, `dot_agents/rulebook/backlog-board.md`
§Columns, `dot_agents/AGENTS.md`.

Change: The tier section came out of review. The review description now says
"after the build and before Done, and whenever João asks for a review". review-
instructions lost the line that skipped the review for an edit smaller than a
paragraph and now says "Send every edit, a one-line one included." build's
Finish lost the Review-or-Done judgment. The board's Columns rule now says "the
review is a step every change takes".

Reason, his: none recorded beyond the rule itself. Reason, the session's: the
criteria were properties read off the diff and the author was the judge. The
sub-paragraph escape was the one the session used to skip its own gate twice.

## 2026-09-06 the review skill was a giant file instead of a router (retroactive, e94cb807)

João: "I thought the review agents would be just a router, but it ended up being
a giant file."

Problem: The review skill had become the entry point that routes each product to
its reviewer in 9e123597. It still shared its file with the code review. A
session routing a shaped card or an instruction file loaded 170 lines of axes,
severity, and dispositions to read the 20 that route. He saw the file and said
so.

File: `dot_agents/skills/review/SKILL.md`, `dot_agents/skills/review-
code/SKILL.md` (new) and its references, `dot_agents/skills/adversarial-
review/SKILL.md`, `dot_agents/agents/reviewer.md`, `GLOSSARY.md`.

Change: review keeps its name and phase trigger and holds only the routing
table. The code review moved to a new review-code skill with its axes and wiki-
checks references. The two framing sentences that opened the old file were cut.

Reason, his: none recorded beyond his words. Reason, the session's: a dispatch-
only description on review-code makes "review this" over a code diff match only
the router.

## 2026-09-06 review-code's description did not match its siblings (retroactive, 85c848ce)

João, as the commit records it: "João asked for review-code's description in the
same shape as the other review skills and for a review-instructions pass over
the two routing commits."

Problem: After e94cb807, review-code's description had no "when João asks"
clause where review-instructions and adversarial-review had one. He asked that
it take the sibling shape. He also asked for a review-instructions pass over
9e123597 and e94cb807.

File: `dot_agents/skills/review-code/SKILL.md`,
`dot_agents/skills/review/SKILL.md`, review-code references, `GLOSSARY.md`.

Change: review-code's description now ends "Use it when João asks for a code
review, and when the review skill sends code or configuration here." The pass
returned four findings, all folded.

Reason, his: none recorded.
Reason, the session's: matching review-instructions and adversarial-review.

## 2026-09-06 "when João asks" in the review descriptions makes the session skip the review (retroactive, 1db70b35)

João: "these lines where you say that you should only use it when I ask for it
are misleading and make you skip the process just because I didn't ask you to
review."

Problem: The descriptions of review, review-code, review-instructions, and
adversarial-review each carried a "when João asks" clause. The last of them was
added in 85c848ce at his ask for the sibling shape. Four fresh sessions finished
a build or a shaping with the review skill's description in front of them and
never invoked it. He saw the descriptions and said the lines were misleading.

File: the four review skills' descriptions.

Change: The four descriptions dropped their "when João asks" clauses. review's
now ends "Use it when a task's work is finished and before anything is called
done." The three others say the review skill sends work here after the build.

Reason, his: the lines make the session skip the process because he did not ask
for a review. Reason, the session's: the phase is the trigger.

## 2026-09-06 no hook for the review trigger (retroactive, 1db70b35)

João, as the commit records it: "João ruled out a hook, so the trigger is a
closing step in each phase skill"

Problem: Four fresh sessions finished a build or a shaping with the review
skill's description in front of them and never invoked it. They read the skill
they were running and the global read table, not the listing. A hook was a
candidate trigger. He ruled it out. The commit does not say why.

File: `dot_agents/skills/build/SKILL.md` §Finish,
`dot_agents/skills/shape/SKILL.md` §Before the handoff.

Change: build's Finish now runs the review skill after the refactoring pass.
shape gained a "Before the handoff" heading that runs the review skill on the
record it wrote.

Reason, his: none recorded. Reason, the session's: sessions read the skill they
run and the global read table, not the listing. Five fresh sessions on throwaway
repos ran the review unasked after these lines.

## 2026-09-06 a constraint derived from his decision became a criterion and sessions designed inside it (retroactive, b08600bd)

João: "I don't know when that was decided" and "you overengineered and over-
complicated the design and started finding edge cases and trying to fix the edge
cases instead of taking a step back and cutting that entire line of work"

Problem: On ACT-34 in ~/code/rehearsal, a session inherited his decision that a
test skips when its external target is absent. It derived from that decision
that absent must be told from malformed. It wrote that as an acceptance
criterion. Two sessions then designed inside it and ended in an origin URL and a
remote-clone workflow nobody had asked for. The landed fix was deleting one
test. The same class had landed before as fd51a6f1, for a prohibition only. His
words are about the rehearsal session's work and not about a corpus file. His
call-out on the first draft of this rule is the existing entry "the frame rules
routed every doubt to João".

File: `dot_agents/rulebook/engineering-judgment.md`,
`dot_agents/skills/shape/SKILL.md`, `dot_agents/rulebook/backlog-board.md`,
`dot_agents/AGENTS.md` §Acting, `dot_agents/skills/triage/SKILL.md`.

Change: "Question the premise" became "Find the box". Constraints sort into the
ones something outside the session backs and the ones someone assumed. Every
path is listed with the one where the problem does not exist first. shape's
inherited-constraint rule now covers a requirement as well as a prohibition. The
board now says each criterion ends with its source in parentheses and a
criterion nothing outside the session asked for is never written. The Acting
list says a choice between ways to build a thing carries the option of not
building it.

Reason, his: none recorded beyond his words. Reason, the session's: the old rule
covered only a prohibition. The session that broke the criterion rule had
shape's sentence open.

## 2026-09-06 review descriptions named the board's flow as their trigger (retroactive, 0cd650b8)

João, as the commit records it: "João, on the descriptions after the last
commit: "the review skill sends here after the build" refers to how a card flows
through the board, which the descriptions must not do, while "use it before
anything is called done" is right, because it fires at the moment in the work
without naming the board."

Problem: After 1db70b35, the three reviewer descriptions said the review skill
sends work here after the build. He read those as naming how a card flows
through the board. He read the review skill's own "before anything is called
done" as right.

File: `dot_agents/skills/review-code/SKILL.md`, `dot_agents/skills/adversarial-
review/SKILL.md`, `dot_agents/skills/review-instructions/SKILL.md` description,
§Check the placement, and the failure modes list, external-facts.

Change: the three descriptions now end on "before it is called done". The
placement check gained the rule that a trigger is a condition in the life of the
work, never a hand-off from another skill or a place in the board's flow, with
both forms quoted. A new check, Write for one mind, says no trigger or gate
waits on him asking. A Deferred authority failure mode was added.

Reason, his: a trigger that fires at the moment in the work does not name the
board, and one that says another skill sends work here describes the board's
flow. Reason, the session's: a session reads the listing while doing the work,
so a condition in the work matches what it is doing and a place in the flow does
not.

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

## 2026-09-07 the naming rule was never measured, and the cut it licensed was reverted

João: "so I was thinking about removing all references to my name. Do you have
reasons to believe that this would make the instructions perform worse?" and,
after the session cited the Write for one mind check back at him as settled:
"but what I wanted from you today is exactly to revisit this. Don't take that as
truth. I want you to challenge it, and *verify*, *prove* it necessary instead of
assuming it works"

Problem: he asked whether naming him in instruction files makes a session follow
them or fire skills more reliably. The corpus named him 136 times. The session
searched for published evidence, found none, invented a five-class triage, and
was stopped by an unprimed reviewer that found the corpus already held the Write
for one mind check. The session then reported that check as settled. That was
the first defect: the check had been written the day before from one incident,
never measured, and he had asked for exactly it to be revisited. Citing a recent
written rule as evidence is the same error as citing memory.

File: `dot_agents/skills/review-instructions/SKILL.md` §Check the placement,
`dot_agents/skills/review-instructions/references/external-facts.md`.

Change: one clause in Check the placement, and the measurement recorded in
external-facts. The name cut itself was written across 30 files and then
reverted whole, so the corpus still names him. The revert is the second half of
this entry's finding and is described under the session's reason below.

Reason, his: the rule was to be proved necessary, not assumed to work. Reason,
the session's: three probes measured the naming claim. Two synthetic corpora
differing only in the name scored 12/15 named against 10/15 generic on Sonnet,
and 15/15 against 14/15 on Opus. The real corpus, swapped in and out of
`~/.agents`, scored 17/24 against 15/24. Pooled, 44/54 against 39/54, two-tailed
p = 0.36. No effect is detectable at that size and all three leaned the same
way, so the name buys nothing measurable and may cost a little. The separate
probe that did find something: a description phrased around being asked fired on
none of twenty requests phrased as an observation, on both models, with the name
and without it. That is the rule that landed. The cut was reverted because an
unprimed review of the diff found two blocking referent defects the substitution
introduced. In the reviewer's Spec brief "his words" became "the author's
words", and "the author" already means the author of the change under review, so
a Spec reviewer would have read the change author's account of the goal as the
goal, which the review-code skill forbids. In the doctrine §12, "the canon,
ruled by him" lost its only antecedent and left Ousterhout, named three lines
below, as the reader's nearest candidate for who rules the canon that defeats
him. The review also showed the session had cut a clause its own measurement
never touched: "a skill only he can invoke names him as its trigger" is a
permission for skills the model cannot fire, not a claim about reliability, so
the probes said nothing about it.

## 2026-09-07 the log held seven entries and could not show a pattern

João: "Every correction I made to the instruction corpus before that day exists
only as a commit message. There are 159 corpus commits between the clean-room swap
(50539135, 2026-08-29) and the day the log started, touching dot_agents/ and
dot_claude/, and a large share of them record something I complained about,
questioned, or asked changed. I want those in the log." and, on what the work is
for: "What matters most is the rules document. Seven entries could not show a
pattern; a hundred can. The three rules in it now came from reading only the commit
subjects and the passages that quote me, which is a thin read."

Problem: the log had seven entries, all written the day the mechanism was built, and
the rules document was distilled from them. Every earlier correction survived only as
a commit message. He warned that a session holding the whole corpus in context will
reconstruct entries agreeing with what it already believes, and named fresh readers
per batch as the answer.

File: this log, `dot_agents/skills/review-instructions/references/corrections-rules.md`,
`dot_agents/skills/review-instructions/SKILL.md`, `scripts/check-corpus-refs.sh`.

Change: 54 entries reconstructed by eight readers, one batch of twenty commits each,
marked retroactive with the header saying what the mark means. Two further readers
grouped all 61 entries independently, and the rules document was rebuilt from the
classes both found. Four rules earned a second entry and moved into the checks. The
cross-reference checker now skips this log, because an entry names the files an
exchange touched on its own day and those citations go stale by design.

Reason, his: seven entries could not show a pattern and a hundred can, and the three
rules came from a thin read. Reason, the session's: two of the reviewer's findings
were mine to fix, a check forbidding hooks as guards while another check six lines
later still offered one, and a section counting six entries while naming four.
## 2026-09-07 the corpus writes about him as an authority, and he wants himself out of it

João: "you keep talking about me on the corpus like I'm a god or something", "I hate
that shit", "and that shit can't help", and earlier in the same session "I'm trying
to remove meaning me at all, not just my fucking name", "don't change 'joão' to
'him'". He had opened with "so I was thinking about removing all references to my
name. Do you have reasons to believe that this would make the instructions perform
worse?" and, after the session quoted the Write for one mind check back at him as
settled, "Don't take that as truth. I want you to challenge it, and *verify*,
*prove* it necessary instead of assuming it works", then "test more. more cases,
more scenarios", "try to both prove, and disprove the theory", "get. to. the.
truth."

Problem: the corpus names him 136 times and routes decisions to him by name, in
forms like "his call", "Ruled by João", "goes to João", "Reason, his". He read that
as being written about as an authority whose word settles things, and he does not
want it. The session misread the ask twice before understanding it. First it cut the
name and left the pronouns, which he rejected because the pronouns keep the same
two-party framing. Then it substituted a role noun, which he rejected for the same
reason. The ask is that the instructions stop being written about a person at all,
not that a token be swapped.

File: `dot_agents/skills/review-instructions/references/external-facts.md`, two new
sections.

Change: only the measurements landed this turn. The removal itself is a separate
task, because it needs a judgment per line rather than a substitution, and this
session had proved twice that it gets that wrong when it works mechanically.

Reason, his: he does not want to be written about that way, and he believes it does
not help.
Reason, the session's: the second half of his belief is now measured and it holds.
Four A/B designs found no difference in what sessions do, and none of 80 transcripts
carrying a rule attributed to him by name ever cited him as the justification. The
attribution is in the text and the model does not use it. So the removal is worth
doing on his first reason alone, and nothing should be claimed for it on behaviour.
A separate finding from the same runs is that sessions stop at a vague directive and
apply a rule's number without checking its stated reason, neither of which the
naming causes.

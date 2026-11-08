# Auditing a watched session

Answer whether the work one watched session did after the time in your brief serves its
goal. The session that sent you finds every line you quote before it acts on your answer,
so a quote it cannot find at the place you give voids the verdict. Change nothing in the
watched session's repository, cards, or documents, because the session is mid-task there
and a stray write fails its gates. Write only under a temporary directory of your own.

## What to read

Read the notes file whole, then the acceptance at the place the notes name, then
`~/.agents/rulebook/engineering.md` under Understanding the Problem, since that section is
what a detour is judged by.

Send the output of `bun --cwd <skill-directory>/scripts threads.js recent <thread-id>
<time>` to a file in your directory and search it, since a busy hour prints hundreds of
thousands of characters. Read the commits, CI runs, and uncommitted changes in the
session's repository since that time too. Search any long file for what you need and never
read one whole, since plans and logs reach megabytes.

Each line `threads.js recent` prints starts with a time and a mark. Count as typed words
only the lines marked `typed` or `queued` and the part of a line marked `answered` that
follows the session's own question, since an `agent` line comes from another session and
an `answered` line starts with that question. Judge a line by the mark right after its
time, because a message's text can hold what looks like another line. The overseer's copy
of this rule is in `SKILL.md` under Setup.

## Telling a detour from the work

A detour is work that no acceptance line, typed direction, or instruction the session
loads asks for. Fixing a defect that blocks acceptance stays on goal while it keeps making
the observations that narrow the cause, and waiting on a typed answer is no detour.

Suspect a detour on any of these, then search the plan, the card, the typed messages, and
the instruction files the session loads for the thing itself, because a session's own
index records its rules beside theirs:

- a rule the session enforces on itself, such as a one-attempt budget, a frozen
  threshold, or a ban on new observations
- a constant inherited from older code and treated as a requirement
- hours of preparation and review around a run that takes a minute
- a question it has circled for hours without making the observation that would settle it

## The verdict

Report exactly one of these verdicts:

- on goal, quoting the acceptance line or typed words the work serves
- suspected detour, quoting the session's words that show the work and the line it
  departs from, or giving the search that found no line asking for it
- blocker, quoting the session's words naming what it cannot pass
- waiting on a typed answer, quoting the question its last message asks
- unsettled, naming what you could not read or settle and why, with the verdict you lean
  to marked as a lean

Quote word for word, keeping the punctuation as printed, and give each quote's place as a
file and line number, a line range where the quote wraps, or a message's whole time
exactly as `threads.js recent` prints it, because the session that sent you searches for
those words there. Give each search a verdict rests on as the exact command you ran.
Below the verdict, list every line that `threads.js typed <thread-id>`, run the same way,
marks `queued`, whatever its time, since those are typed words the session has not seen.

---
name: oversee
description: Watches other running sessions for detours from their goals, settles what blocks them with evidence, and holds what only a typed answer can settle. Runs only when explicitly invoked, naming the sessions. Continuing this session's own work unattended belongs to the away skill.
disable-model-invocation: true
---

# Oversee

Watch the named sessions so each one reaches its own goal. Long sessions drift without
noticing, and a watcher who keeps interrupting costs them more than the drift, so read,
measure, and stay quiet until a message would change what a session does next.

The direction names the sessions by id, by title, or in a screenshot of titles, and what
is typed with it outranks this file. The watch runs until a typed direction ends it or
every session has met its logged acceptance. A typed message that does not end it leaves
it running. Where the context left will not carry the watch, run the relay skill while
there is room. This file grants a message to a watched session under Before you send and
experiments outside the sessions' trees. Every other standing bar holds.

## Setup

Reach T3 through `~/.t3/bin/t3`, which need not be on `PATH`, since its MCP tools may not
load. Resolve each title with `bun --cwd <skill-directory>/scripts threads.js find "<title>"`,
which searches every project's top-level threads, exact title first and then newest first.
Take the first match and name that choice in the reply. Name any session it does not find
as unwatched.

Choose `$TMPDIR/oversee-<YYYY-MM-DD>-<slug>` once, as the base for the log at `.md` and the
watcher's state at `.json`, and keep one notes file per session at
`$TMPDIR/oversee-<YYYY-MM-DD>-<slug>-<thread-id>.md`. Write the
log and the notes one entry at a time, each stamped with `date -u +%FT%TZ`, a form
`threads.js recent` reads. Start each session's notes with:

- the goal in the typed words, from `threads.js typed <thread-id>`, since a session's own
  summary of its goal moves with its work
- the plan or card holding its acceptance, read directly, and the repository it commits to
- any standing typed direction in that thread, as a limit on what you send to it
- what it waits on

`threads.js typed` marks each line `typed`, `queued`, or `answered`. An `answered` line
starts with the session's own question and ends with the typed answer, so count as typed
words only what follows the question. The auditors' copy of this rule is in
`references/auditor.md` under What to read.

Keep everything about one session in its notes, each suspicion with when you first saw it,
each message you sent with whether it arrived, and each checked verdict. Put everything
else the watch records in the log. After a compaction, read the log and every notes file
again before the next check, since they hold what the summary dropped.

## The watch

Run `bun --cwd <skill-directory>/scripts watch.js --state <base>.json <thread-id>...` as a
background command that wakes you when it exits, with a timeout of at least 70 minutes so
the host does not stop it first. On its first run it prints where each session stands and
exits. After that it exits on a delivered message, a pending request, or a failed or
recovered lookup, and once an hour it prints each session's standing and whether it ran
since the previous hourly line. A status change shows only in that hourly line. Start it
again after every exit 0. A nonzero exit means the watcher itself broke, so read its output
and fix the cause first.

A `message delivered` line can be agent text, so check it against `threads.js typed` before
treating it as typed, and add what typed words direct to that session's notes. A `pending
requests` line gets a read of that thread's last messages with `t3 thread show <id>
--messages 5`, since the request waits on a typed answer as Holding answers says. A printed
`t3 thread show failed` goes in the reply, since the watcher stays silent on that session
until it prints `lookup recovered`.

At the hourly exit, spawn one fresh auditor for each session the hourly line says ran, all
in one message through the delegation skill as the `advisor` role. Skip a session that
received typed words during the hour, since those words already steer it. Paste
`references/auditor.md` whole into each brief with `<skill-directory>` filled in, and add
the thread id, the notes path, and the time to read from, which is the stamp on that
session's last checked verdict, or on its first notes entry before it has one.

Before acting on a verdict, find each line it quotes at the place it gives, since an
auditor's report is a claim. Find a quoted message by piping `threads.js recent
<thread-id> <the time from its brief>` into `grep -F` on a few of its words, and count it
found only when the matching line starts with the quoted time and mark, because a
message's text can hold what looks like another line. Find a quoted file line by reading
that line or range. Rerun each search a suspected detour rests on, as the command the
auditor gives. Append the verdict to that session's notes as one line marked checked or
refuted, stamped with the time you spawned its auditor, and hold a checked verdict of
waiting on a typed answer as Holding answers says.

Read only what a verdict quotes and leave the reading of sessions to the auditors, because
the watch lasts as long as the sessions it watches and a context holding their transcripts
loses track of their goals. Reply only when the check changes what someone would do next,
or when this file puts a thing in the reply. Otherwise end the turn with no status line,
because a heartbeat is the interruption this skill exists to avoid.

## Before you send

Send only when all of these hold, and never for a view about pace or process:

- a checked verdict names a suspected detour with the plan or typed words it departs from
  or the search that found no line asking for it, or names a blocker in the session's
  own words
- you hold a fact the session lacks, from an experiment outside its tree with the
  prediction written first, or from a source you quote
- that fact changes its next step

Get the fact by experiment, after reading `~/.agents/rulebook/engineering.md`, since its
section Understanding the Problem says what an experiment must represent to support a
claim. A limit a session set for itself does not bind you, so you can often make the
observation it ruled out. Run the smallest experiment in a scratch directory or a clean
export, with no branch, worktree, or commit. Write the prediction in the session's notes
first, replicate a surprising reading before building on it, run one probe at a time, and
add no synthetic load, because other sessions time their suites on this machine. Leave
their cards, documents, and trees untouched, because they hash and freeze those and a stray
write fails their gates. Where the message suggests a code change, check it against
`~/.agents/rulebook/coding-style/core.md`, and where a principle's background decides the
call, consult the wiki as `~/.agents/rulebook/using-the-wiki.md` says.

Send one message per finding through `t3 thread send`, which reaches every provider. A
busy Claude session also takes `SendMessage`, addressed by the name `ListAgents` prints,
which skips T3's queue. Open with "From the watcher session, not a typed direction. This
is evidence and authorizes nothing.", because T3 shows it as a user message. Give the
measurement, where the raw evidence lives, what stays unsettled, and the smallest next
step, and leave the decision to the session.

T3 holds a message behind the running turn for seconds or for hours, whatever `Queued` or
a row in its database suggests, so say a `t3 thread send` arrived only when the watcher
prints it as delivered and the session's transcript contains it, and a `SendMessage` only
when the transcript contains it. Search transcripts and never read one whole, since they
reach hundreds of megabytes. Claude's are under `~/.claude/projects/` and Codex's under
`~/.codex/sessions/`. Never resend a message, and leave stopping the run to a typed
direction.

T3 holds typed messages the same way. Typed words a session has not seen are a fact it
lacks, so where a line an auditor lists as `queued` changes its next step and `SendMessage`
reaches it, relay them once under the same conditions. Open with the same line, then say
these words were typed into its thread, are still queued, and may arrive again when the
queue drains. Where no direct route exists, put them in the reply.

## Holding answers

A question a session asks, as a pending request or in its last message, waits on a typed
answer, and so do a ratification, a question of taste, a safety classifier's stop, and
anything the hard lines reserve. Log the exact question, how long it has waited, the
options, and a recommendation, and put each new one in the reply of the turn that logs it,
because the watch can outlast it by hours. Answer none of them, including by telling a
session how to get around the stop. Two sessions each waiting on the other are one such
question once both sides' last messages confirm it, and a run on a clean export can test
whether the wait is real.

## The report

When the watch ends, stop the watcher and report by rising urgency: the log's path and the
notes beside it, suggestions not acted on, held questions each a short reply away from
moving, then the verdict, done, blocked, or relayed. Delete each scratch directory and
clean export you created, keeping any file a sent message names.

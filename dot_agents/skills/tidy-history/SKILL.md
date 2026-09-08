---
name: tidy-history
description: Rewrites the commits not yet on any remote into one commit per piece of work, folding each fix-up into the commit it corrects and untangling the streams that concurrent sessions interleaved, with the final tree unchanged. A pushed commit stays as it is, and a merge in the range stops the run. Runs only when typed.
argument-hint: "[base commit, the newest one to leave alone]"
disable-model-invocation: true
---

# Tidy history

## What is yours to rewrite

Run `git fetch --all` first, since a stale remote ref counts a pushed commit as
unpushed, and a pushed commit is never rewritten. The range is `git rev-list HEAD
--not --remotes`, newest first. The base is the argument where one is given, and
the parent of the range's last line otherwise. Where that line has no parent and
there is no argument, stop and ask for one. With an argument, the range is the
commits above it. Where the range holds a merge commit, stop and report, since
this skill rewrites a linear range.

## Read before you plan

Read every commit in the range, `git log --stat` first and then each diff. Group
the changes, and never the commits or their order, by the piece of work they
serve, since a commit can carry more than one and concurrent sessions interleave
theirs. Sessions share one index, so a commit can carry what another session had
staged for other work, and its message accounts for that session's part alone.
Split such a diff along that seam, by path or by hunk where one path holds both.
The part the message does not account for joins the work it serves, as one commit
where that work has none. A change that corrects or completes an earlier unpushed
change belongs with it, because the reviewer wants the corrected version only. A
change fully undone later in the range disappears. Two changes that would not
build apart, or that a reader needs side by side to understand, are one commit.
Two that are independent are two, so that either can be reverted alone.

A commit the plan keeps whole, nothing folded in and nothing split out, stays as
it is, since the reviewer has nothing new to read there. The base moves up to the
newest commit of the run of kept commits that starts at the old base, so those
keep their hashes.

Write the plan before touching the repository, one entry per new commit in order.
An entry names the old commit it keeps whole and nothing else, or what it carries:
each path, the old commit whose state the path takes where that is not the final
one, the patch where no old commit has that state, and the message. The message's
reason comes from the old messages, and the old subjects are not the message. The
plan is complete when every path changed in the range is assigned and the commits
together reproduce the current tree.

## Rewrite

Save the current HEAD hash. Run the rewrite as one script, so the window in which
another session could commit onto a half-built index is as short as the script.
The script opens by fetching again and recomputing the range, and stops where the
range shrank, since a push landed after the first fetch. It stops where HEAD is not
the saved hash, since another session extended the range and the plan is stale.
Where `git status --short` prints anything, it stashes those changes, untracked
files included, and records that it did, since a pop with nothing stashed takes
whatever stash other work left.

`git reset <base>` leaves the working tree at the final state and the index at the
base, with the old commits reachable from the saved hash and the reflog. Then stage
each planned commit and commit it with the plan's message. Stage every path from an
old commit or from a patch you write, never from the working tree, so an edit
another session makes mid-rewrite stays out of the commits.
`git restore --staged --source=<old commit> -- <path>` stages the state that commit
left a path in, and `git apply --cached` stages a split no old commit made. A kept
commit is staged from itself and committed with `git commit -C <old commit>` under
`GIT_COMMITTER_DATE` set to its old committer date, so every field but the hash
stays, since the hash covers the parent. Before each commit the script checks that
HEAD is the base or the commit it made last, and that `git diff --cached
--name-only` lists the plan's paths for that commit and no other, and aborts where
either fails, since another session committed or staged into the range. An abort
leaves the commits made so far and the stash in place and reports the saved hash
and the stash entry, because a hard reset would discard that session's commit and
the stash holds work the reader must pop.

## Verify and report

`git diff <saved hash> HEAD` prints nothing. Otherwise the rewrite lost or invented
a change, so reset to the saved hash, fix the plan, and run the script again, since
a fix outside the script has none of its checks. `git status --short` prints
nothing. Otherwise another session edited the tree mid-rewrite, and the edit stays
where it is and is named in the report. Every kept commit below the first
rewritten one is reachable from HEAD by its old hash, and every other kept commit
carries its old author and committer dates, so the script checks both. Then pop
the stash where one was made. Where the pop conflicts with a mid-rewrite edit,
leave both as they are and name the stash entry in the report.

Report every commit in the range, oldest first, a kept one by its hash, old and
new where it moved, and a new one with the old commits it absorbed, and the old
commits that vanished as undone. Give the saved hash, since `git reset --hard` to
it on a clean tree undoes the rewrite.

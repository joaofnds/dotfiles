---
name: dream
description: Consolidates this project's memory store, merging duplicate notes, surfacing contradictions for João, pruning what no longer exists, repairing links and stale paths, and rebuilding the index within its load budget. Use when the store has grown noisy or repetitive. Writing a new memory is not this, and improving the corpus is kaizen.
disable-model-invocation: true
---

# Dream

The memory store is the notes the harness loads for this project, each a markdown file
with frontmatter, plus an index that points at them. The index is loaded whole at
session start up to a cap, and everything past that cap is silently dropped, so detail
parked in the index costs the entries below it their visibility. The cap's current
value and its re-check trigger are in the review-instructions skill's external-facts
reference.

Consolidation is judgment rather than retrieval, so a sub-agent doing this pass runs
on the most capable model at high effort, by the delegation skill's model rule.

Find the store from the harness's own layout rather than from memory of it, and read
the index and every note before proposing anything. Where the project has no store,
say so and stop.

Preserve each note's frontmatter exactly, including keys this skill does not know,
since the harness writes some of them. Never invent or refresh a timestamp the harness
owns.

## Look before you touch

Back the store up before the first write. Then work through it without changing
anything, building the proposal.

**Duplicates.** Two notes encoding the same knowledge in different words merge. Draft
a survivor more complete than either, keep the better name, union the links, and carry
the newer origin and timestamp. Where only one carries a key, the survivor carries it.
Where neither does, it has none.

**Contradictions.** Two notes asserting opposing facts about one topic are João's
call, never yours. The newer note is the likely winner and that is not enough. Record
both and the topic.

**Prunes.** A note is prunable when what it describes no longer exists, or when a
newer note superseded it. A note whose only defect is a date nothing can anchor is
never a prune: the knowledge is unique and the phrasing is what failed. Verify against the repository before proposing, since a file
you failed to find may mean your search was wrong. Age alone is never grounds, and an
old load-bearing fact stays. Where the knowledge exists nowhere else, merge it instead
of deleting it.

**Links and paths.** List index entries pointing at missing files, notes missing from
the index, and links whose target is gone. For anything you plan to merge or delete,
list the inbound links that will need repointing. A corpus path a note cites can rot
the same way, so list the ones that no longer resolve, with the replacement where a
search finds one. Repair the pointer and never the fact it supports.

**Relative dates.** A note saying "last month" loses its meaning as soon as its
context is gone. Where the note's own timestamp can anchor the phrase, resolve it to
an absolute date, anchoring on the timestamp of the note the phrase came from. Where
nothing can anchor it, report it and leave it alone. Never derive a date from a file
this run already rewrote, since its timestamp is now the run's own.

**Index lines.** Only where the index is near its cap, shorten the longest lines by
moving what they carry into the note bodies, and stop once the projected index fits
with room to spare. Below that, line lengths are João's business. Shortening a line by
dropping what it says is a prune, and prunes go through the rule above.

## Propose, then apply

Print the proposal before changing anything: the index's current size against its cap,
then each merge, contradiction, prune, link repair, date repair, and shortened line.
Ask before applying. A run with nothing to propose says the store is clean and stops.

Apply merges, then contradictions João resolved, then prunes, then the repairs, then
rebuild the index with one line per note on disk. Resolving a contradiction keeps the
winner, notes in its body that it was updated and what the losing claim said, and
deletes the loser. A deleted note's inbound links are
repointed to its survivor, or stripped where a prune left none. Write relocated text
into a note body before shortening its index line, so no run can leave the detail in
neither place.

## Verify with tool output

Check by running, not by asserting: every index link resolves to a file, every note
appears in the index, no link points at a note that is gone, no corpus path you
rewrote is still stale, and the index fits its cap. A dangling link is a miss in the
apply step, so go back and fix it before reporting.

An index that cannot be brought under its cap by any merge, prune, or shortening the
rules allow is João's decision. Report the overflow and the notes past it rather than
stretching a rule to fit.

Keep the two most recent backups and remove the older ones. Then report what changed,
the index's size, and where the backup is.

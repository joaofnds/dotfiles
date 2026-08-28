---
name: dream
disable-model-invocation: true
description: >
  Consolidation pass over this project's native Claude memory store
  ($CLAUDE_CONFIG_DIR/projects/<slug>/memory/, default ~/.claude/…): merges duplicate notes, resolves
  contradictions, prunes stale entries, repairs [[wikilinks]], and rebuilds the
  MEMORY.md index. Invoke when the store has grown noisy or repetitive, or for
  periodic cleanup: "dream", "consolidate memory", "clean up project memory".
  Not for authoring new memories or improving skills/agents/rules; that's kaizen, or
  /absorb when an external subject (a repo or file to learn from) drives it.
argument-hint: "[--auto]"
---

# Dream: Memory Consolidation

**Wrong skill if:** you want to review a code change → `/adversarial-review`, or the `code-reviewer` agent.

The store you consolidate is Claude Code's native memory: per-project markdown notes
under `$CLAUDE_CONFIG_DIR/projects/<slug>/memory/` (default `~/.claude/projects/…` when the
env var is unset), each with this exact schema: preserve it byte-for-byte when you rewrite
a note:

```
---
name: <slug, matches filename without .md>
description: "<one-line summary>"
metadata:
  node_type: memory
  type: <feedback | project | …>   # keep whatever the originals use
  originSessionId: <uuid>
  modified: <ISO 8601, when the original has it, harness-written, never invent one>
---

<prose body: what/why/how-to-apply/root-cause, with [[wikilink]] cross-refs>
```

Carry through any frontmatter key not shown here unchanged; the harness may add fields
this skill does not know.

`MEMORY.md` is the index: one line per note, `- [Title](file.md) — <one-line hook>`.
It is a pointer list, not a content store: the harness loads the index's first 200 lines
or 25KB and silently drops the rest (`instruction-external-facts.md` §Harness mechanics),
so detail parked on one line costs the entries below it their visibility.

**Model:** consolidation is dedup-and-contradiction *judgment*, not a speed task. If you
spawn this as a background/subagent pass, run that subagent on the most capable reasoning
model available, at `high` effort or above. Spawn it un-named;
`~/.agents/rules/subagent-spawning.md` §The two shapes picks foreground vs background.

**IMPORTANT: Execute the phases strictly in order (1 → 2 → 3 → 4 → 5). Each depends on the
previous. Do not modify or delete any note before Phase 4** (the Phase 1 backup is the only
earlier write).

## Phase 1: Orient

1. Resolve the current project's memory dir from the working directory. The config root is
   `$CLAUDE_CONFIG_DIR` when set, else `~/.claude`; always honor the env var, since the live
   store lives wherever the running session put it:
   ```bash
   slug=$(printf '%s' "$PWD" | sed 's:[/. ~]:-:g')
   cfg="${CLAUDE_CONFIG_DIR:-$HOME/.claude}"
   mem="$cfg/projects/$slug/memory"
   ls -la "$mem" 2>/dev/null || { echo "No memory store for $slug"; }
   ```
   If the dir doesn't exist, `ls "$cfg/projects/"` and match by eye (worktrees
   and dotted paths encode `.`→`-`). No memory dir ⇒ nothing to consolidate; say so and stop.
2. Back up before touching anything (new timestamped copy each run; Phase 5 prunes the
   old ones):
   ```bash
   cp -r "$mem" "$mem-backup-$(date +%Y%m%d-%H%M%S)"
   ```
3. Measure the index against its cap; Phase 3 reports both numbers and Phase 5 rechecks
   them:
   ```bash
   wc -c "$mem/MEMORY.md"; wc -l "$mem/MEMORY.md"
   ```
4. Read `MEMORY.md` and every `<name>.md` note. Build a map: title, `type`, summary,
   `originSessionId`, age (file mtime), and the fact each asserts. You now know the store.

## Phase 2: Analyze: find issues (no writes)

Work entirely in memory. Produce candidate lists; change nothing yet.

- **2a. Near-duplicate notes (merge).** Two notes are duplicates when they encode the same
  knowledge phrased differently. Proxy for similarity: >60% overlap of significant nouns
  AND compatible (non-contradicting) content. Draft a merged note more complete than either
  original; keep the better filename/slug, union the `[[wikilinks]]`, keep the newer
  `originSessionId`. Carry `metadata.modified` into the merged note: the newer value when
  both originals carry it, the only value when one does, no key when neither does. Never
  invent or refresh it; 2e anchors on this value next run.
- **2b. Contradictions.** Two notes assert opposing facts about the same topic. Do **not**
  auto-resolve: the newer / higher-context note is the *likely* winner, but flag the pair
  for the user. Record both slugs and the topic.
- **2c. Prune candidates.** A note is prunable when: it describes a decision/file/behavior
  that no longer exists (verify against the repo before proposing: a file you didn't find
  may mean your grep was wrong, not that the note is stale), OR it was superseded by
  a newer note (contradiction already resolved elsewhere). A load-bearing claim resting on
  a relative date no timestamp can anchor is **not** a prune: the knowledge is unique and
  the defect is the phrasing: list it under **Unanchorable dates** in Phase 3, reported for
  the user, never prompted `a/b/skip`, and unchanged in both modes. A relative date a
  timestamp *can* anchor is a 2e repair. Age alone is **not** grounds to prune; old
  load-bearing facts stay.
- **2d. Index & link integrity.** List MEMORY.md entries pointing at missing files, notes
  on disk missing from the index, and `[[wikilinks]]` whose target note doesn't exist.
  Also list, for every note you plan to merge/resolve/prune, the *inbound* `[[wikilinks]]`
  that point at it: those need repointing or removal when it's deleted (Phase 4). A
  pointer into the instruction corpus rots the same way, and a rename there is invisible
  from inside the store: list every `~/.agents/…` path a note body or an index hook
  names that no longer resolves, with the path that replaced it when a search finds one,
  and as unresolved otherwise. Repair the pointer, never the fact it supports. Paths
  outside the corpus are out of scope here: a note whose subject is a missing file is
  asserting that absence, not suffering from it.
- **2e. Relative-date repairs.** List every note whose body states a relative date that
  the note's own timestamp can anchor: `metadata.modified` when present, else the mtime
  mapped in Phase 1. Include notes already being rewritten for a merge, contradiction, or
  link repair, resolving each phrase against the timestamp of the note the phrase came
  from, never the survivor's. Record the note, the phrase, and the absolute date; this
  list is the count Phase 3 reports.
- **2f. Over-long index lines.** Only when Phase 1's measurement puts the index at or
  past 80% of either cap, the point at which the harness fires its own compaction
  warning, for the same 70% target (`instruction-external-facts.md` §Harness mechanics);
  below that the line lengths are the user's business, and rewriting them all is churn.
  An index line carrying detail the note body holds, or should hold, spends budget every
  other entry needs, so shorten the longest lines first and stop once the projected index
  is under 70% of both caps. List each one with its
  length, the hook it reduces to, and the text moving into the note body. A line is
  shortened only by relocating what it carries; dropping the detail is a prune, and
  prunes go through 2c.

## Phase 3: Diff report

Print the proposal before any change. Omit any empty section.

```
## dream: consolidation report  (<slug>)

Index: <N> bytes, <N> lines (cap: 25KB, 200 lines)

Merges (<N>):
  <a.md> + <b.md> → <merged.md>  "<merged summary>"

Conflicts (<N>):
  <a.md> vs <b.md>: "<topic>"  [a/b/skip]

Unanchorable dates (<N>):
  <file.md>: "<phrase>": no timestamp can anchor it; left unchanged

Prune (<N>):
  <file.md>: <reason>

Index/links (<N>):
  <fix description>

Date repairs (<N>):
  <file.md>: "<phrase>" → <YYYY-MM-DD>

Index lines (<N>):
  <file.md>: <N> chars → <N>

Proposed: <N> merges, <N> prunes, <N> conflicts, <N> index fixes, <N> date repairs, <N> index lines. Apply? [Y/n]
Reported only (no change proposed): <N> unanchorable dates.
```

(Under `--auto`, replace the `Apply? [Y/n]` line with `Applying automatically (contradictions
skipped)…`: see Phase 4.)

An index at or over either cap is never a clean store: when nothing else is proposed,
propose the 2f shortenings, merges, and 2c-permitted prunes that bring it back under.
When none exist, report the overflow and the notes past the cap in place of `Store is
already clean`, and stop: an index that cannot legally fit is the user's decision, not a
reason to stretch 2c.

Zero proposals and zero unanchorable items: print `Dream complete. Store is already clean.`
and stop. Zero proposals with at least one unanchorable item: print the Unanchorable dates
section, skip the `Apply?` prompt, and stop.

## Phase 4: Apply

**`--auto` mode** (`/dream --auto`): apply every proposal automatically except
contradictions (they need human judgment); report those as left-untouched. Otherwise,
interactive:

1. For each conflict, wait for `a` / `b` / `skip` (empty ⇒ skip). Record winners.
2. Prompt `Apply? [Y/n]`. `n`/`no` ⇒ `Cancelled. No changes made.` and stop. Empty/`y`/`yes`
   ⇒ proceed.

Apply in this order, preserving the frontmatter schema above on every written note:

- **Merges**: write the merged note; delete the originals; repoint every inbound
  `[[wikilink]]` from a deleted slug to the survivor. Carry `metadata.modified` per 2a.
- **Contradictions**: for `a`/`b`, delete the loser and add `(updated YYYY-MM-DD, previously:
  <one line>)` to the winner's body; repoint the loser's inbound `[[wikilinks]]` to the winner.
  `skip` ⇒ leave both.
- **Prunes**: delete the note. Never delete a note whose knowledge isn't captured elsewhere;
  if in doubt, demote it to a merge instead. Since a prune has no survivor, strip the now-dangling
  inbound `[[wikilinks]]` from the notes that referenced it.
- **Relative-date repairs**: apply the 2e list exactly. Never derive a date from a file
  already rewritten this run.
- **Stale external paths**: rewrite each 2d path to the one that replaced it, in the note
  body and in the index hook the rebuild below writes. Where the search found no
  replacement, leave the note's claim intact and report the path as unresolved: a pointer
  you cannot resolve is not evidence the fact is dead.
- **Index lines**: apply the 2f list, writing the relocated text into the note body
  before shortening the line, so no run can leave the detail in neither place.
- **Rebuild `MEMORY.md`** preserving its top heading (`# Memory Index`), then one
  `- [Title](file.md) — <hook>` bullet per note on disk: no orphan pointers, no notes missing.

## Phase 5: Verify & summary

Confirm with tool output, not assertion:

```bash
# re-derive the store path: this fence may run in a fresh shell, so don't rely on $mem
slug=$(printf '%s' "$PWD" | sed 's:[/. ~]:-:g')
cfg="${CLAUDE_CONFIG_DIR:-$HOME/.claude}"
mem="$cfg/projects/$slug/memory"
# every index link resolves to a file
grep -oE '\(([^)]+\.md)\)' "$mem/MEMORY.md" | tr -d '()' | while read -r f; do
  [ -f "$mem/$f" ] || echo "DANGLING INDEX LINK: $f"; done
# every note is indexed
for f in "$mem"/*.md; do
  [ "$(basename "$f")" = MEMORY.md ] && continue
  grep -q "($(basename "$f"))" "$mem/MEMORY.md" || echo "UNINDEXED: $(basename "$f")"; done
# no wikilink points at a note that no longer exists
grep -rhoE '\[\[[^]]+\]\]' "$mem"/*.md | sort -u | tr -d '[]' | while read -r s; do
  [ -f "$mem/$s.md" ] || echo "DANGLING WIKILINK: $s"; done
# relative dates in notes Phase 4 rewrote or 2e listed: check hits against the 2e list by name
grep -rniE '\b(last|this|next) (week|month|year)|\byesterday\b|\b([0-9]+|an?|one|two|three|four|five|several|a few|a couple of) (days?|weeks?|months?|years?) ago\b' \
  "$mem"/*.md && echo "RELATIVE DATE PRESENT: a Phase 4 miss only if the note was rewritten or 2e-listed"
# the index still loads whole, and is not back at the 2f trigger
b=$(wc -c <"$mem/MEMORY.md"); l=$(wc -l <"$mem/MEMORY.md")
echo "index: ${b} bytes, ${l} lines"
[ "$b" -gt 25000 ] && echo "INDEX OVER BYTE CAP: $b"
[ "$l" -gt 200 ] && echo "INDEX OVER LINE CAP: $l"
[ "$b" -ge 20000 ] || [ "$l" -ge 160 ] && echo "INDEX NEAR CAP: 2f applies"
# every corpus path a note cites still resolves
grep -rhoE '~/\.agents/[A-Za-z0-9_./-]+' "$mem"/*.md | sed 's/[.,;:)]*$//' | sort -u | while read -r p; do
  [ -e "$HOME${p#\~}" ] || echo "STALE PATH: $p"; done
```

Any `DANGLING WIKILINK` is a Phase 4 miss; go back and repoint it to the survivor or strip it,
then re-run the check until clean. Also confirm no relative date survived in a rewritten or
2e-listed note. `INDEX OVER BYTE CAP` or `INDEX OVER LINE CAP` blocks the completion line
below: the entries past the cap are invisible to every reader, so the run is not done.
Where no shortening, merge, or prune that 2c permits brings it under, report the overflow,
the notes past the cap, and why each of the three levers is unavailable, then print the
completion line: an index that cannot legally fit is the user's decision, not a reason to
delete a note.
`INDEX NEAR CAP` after a run that proposed no 2f shortenings is a Phase 2 miss; go back
and propose them. A `STALE PATH` matching a 2d path you rewrote is a Phase 4 miss; go back
and apply it. Any other, unproposed or unresolvable, is a report and next run's work: it
does not block the backup prune below.

After the checks come back clean, prune old backups: keep the two most recent:

```bash
ls -1dt "$mem"-backup-* | tail -n +3 | while IFS= read -r old; do rm -rf -- "$old"; done
```

Then print:

```
Dream complete: merged: <N>, pruned: <N>, conflicts resolved: <N>, skipped: <N>, index fixes: <N>, date repairs: <N>, index lines shortened: <N>, unanchorable dates reported: <N>
Index: <N> bytes, <N> lines
Backup: <mem>-backup-<stamp>
```

## Safety

- The backup from Phase 1 is the undo. Phase 4's Prunes bullet owns the
  no-deletion-without-replacement rule.
- Source of truth for *this skill* is `dot_agents/skills/dream/SKILL.md` in the dotfiles repo;
  the store it operates on is live user data under `$CLAUDE_CONFIG_DIR` (default `~/.claude/`).
  Different trees; don't confuse editing the skill with running it.

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

`MEMORY.md` is the index: one line per note, `- [Title](file.md): one-line summary`.
It is a pointer list, not a content store.

**Model:** consolidation is dedup-and-contradiction *judgment*, not a speed task. If you
spawn this as a background/subagent pass, run that subagent on the most capable reasoning
model available, at `high` effort or above. Spawn it un-named;
`~/.agents/rules/subagent_spawning.md` §The two shapes picks foreground vs background.

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
3. Read `MEMORY.md` and every `<name>.md` note. Build a map: title, `type`, summary,
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
  that point at it: those need repointing or removal when it's deleted (Phase 4).
- **2e. Relative-date repairs.** List every note whose body states a relative date that
  the note's own timestamp can anchor: `metadata.modified` when present, else the mtime
  mapped in Phase 1. Include notes already being rewritten for a merge, contradiction, or
  link repair, resolving each phrase against the timestamp of the note the phrase came
  from, never the survivor's. Record the note, the phrase, and the absolute date; this
  list is the count Phase 3 reports.

## Phase 3: Diff report

Print the proposal before any change. Omit any empty section.

```
## dream: consolidation report  (<slug>)

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

Proposed: <N> merges, <N> prunes, <N> conflicts, <N> index fixes, <N> date repairs. Apply? [Y/n]
Reported only (no change proposed): <N> unanchorable dates.
```

(Under `--auto`, replace the `Apply? [Y/n]` line with `Applying automatically (contradictions
skipped)…`: see Phase 4.)

Zero proposals and zero unanchorable items: print `Dream complete. Store is already clean.`
and stop. Zero proposals with at least one unanchorable item: print the Unanchorable dates
section, skip the `Apply?` prompt, and stop.

## Phase 4: Apply

**`--auto` mode** (`/dream --auto`): apply merges, prunes, relative-date repairs, and
index/link fixes automatically; **skip all contradictions** (they need human judgment) and
report them as left-untouched. Otherwise, interactive:

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
- **Rebuild `MEMORY.md`** preserving its top heading (`# Memory Index`), then one
  `- [Title](file.md): summary` bullet per note on disk: no orphan pointers, no notes missing.

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
```

Any `DANGLING WIKILINK` is a Phase 4 miss; go back and repoint it to the survivor or strip it,
then re-run the check until clean. Also confirm no relative date survived in a rewritten or
2e-listed note.

After the checks come back clean, prune old backups: keep the two most recent:

```bash
ls -1dt "$mem"-backup-* | tail -n +3 | while IFS= read -r old; do rm -rf -- "$old"; done
```

Then print:

```
Dream complete: merged: <N>, pruned: <N>, conflicts resolved: <N>, skipped: <N>, index fixes: <N>, date repairs: <N>, unanchorable dates reported: <N>
Backup: <mem>-backup-<stamp>
```

## Safety

- The backup from Phase 1 is the undo. Phase 4's Prunes bullet owns the
  no-deletion-without-replacement rule.
- Source of truth for *this skill* is `dot_agents/skills/dream/SKILL.md` in the dotfiles repo;
  the store it operates on is live user data under `$CLAUDE_CONFIG_DIR` (default `~/.claude/`).
  Different trees; don't confuse editing the skill with running it.

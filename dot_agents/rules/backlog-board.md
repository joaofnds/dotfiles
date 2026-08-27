# Backlog board

Board mechanics shared by the chain skills: bootstrap, cards and columns, the guard,
doc conventions, milestones, closeout, migrate-on-touch, and CLI coupling. Read
before any read or write of a `backlog/` board, in any session, chain skill or
not. The chain skills own the process;
backlog.md holds state only: never adopt its `instructions` or agent-guide output.

## Bootstrap

When the repo root has no `backlog/config.yml`, create the board before the first
board write; a read-only request reports that no board exists and creates nothing:

1. Verify the board will be git-ignored: `git check-ignore -q backlog/config.yml`
   must exit 0 (the bare directory name exits 1 while nothing is on disk). On
   failure, create nothing; hand the user the fix: add `backlog/` to the file named
   by `git config core.excludesFile`, or to `~/.config/git/ignore` when that key is
   unset.
2. `mkdir -p backlog/tasks backlog/docs`
3. Copy `~/.agents/backlog-config.yml` to `backlog/config.yml`.
4. In the copy, set `project_name` to the repo directory's name, quoted.

Never run `backlog init`: it writes backlog's own workflow-instruction block into
`AGENTS.md`, a second source of process truth.

## Cards and columns

One card per feature; the card carries status, acceptance criteria, dependencies,
labels, notes, and the final summary. A stage skill verifies the column from
`backlog task <id> --json`, moves the card into its own column when it starts (a
skill that names no column leaves the card where it is), and,
before ending any turn that changed card state, puts what changed on the card.
Given no card, bootstrap the board and create one in the stage's column, unless the
skill directs otherwise. Done means closed out. Review means a review in
flight: the reviewing skill moves the card in, attaches its report doc, and returns
it to Done once findings are dispositioned; never leave a card parked in Review.

Backward moves are legal, and a card may be created directly in any column; that is
how small work skips the front half. Bug and spike work travels the same columns
(`backlog task create --type bug`); a diagnosis doc attaches like any other
artifact. Direct edits outside the chain need no card.

## The guard

backlog.md enforces schema, not workflow: it accepts Done with unchecked criteria,
forward moves over open dependencies, and nonexistent attachment paths. Refuse those
three yourself, before issuing the command:

1. **Done with unchecked criteria.** Before `backlog task edit <id> -s Done`, run
   `backlog task <id> --json`; when any `acceptanceCriteria[].checked` is false,
   refuse the move, unless the card carries a `partial` or `abandoned` label, the
   sanctioned early closeout.
2. **Forward over an open dependency.** Before any `-s` move to a later column in
   the config's status order, read the card's `dependencies[]`; when any listed card
   is not Done, refuse the move. Backward moves are exempt.
3. **Dangling attachment.** Before passing a path to `--doc` or `--ref`, stat it;
   when it does not exist on disk, refuse the attach.

A refusal is not an error to route around: report the blocked operation and what
unblocks it (check the criterion with evidence, close the dependency, create the
file first). Everything else (right column for the stage, artifact present) is the
skill's own judgment, because skip points give those rules legitimate exceptions.

## Docs

Stage artifacts (spec, options, grilled, plan, design, diagnosis, review) are
hand-editable markdown files in flat `backlog/docs/`, attached to the card with
`--doc`. Never inline an artifact into a task field. Title them with a plain
stage-suffixed name ("<feature> spec", "<feature> plan, milestone 2"), no date
stems. After attaching, tell the user the doc path and the card ID.

Create docs with `backlog doc create`, or write the file by hand with the four-key
frontmatter (without it the doc lists as a blank row):

    ---
    id: doc-7
    title: <feature> spec
    type: other
    created_date: 'YYYY-MM-DD'
    ---

Hand-assigned IDs are safe: the CLI allocates max+1. `backlog doc create` rejects
paths outside `backlog/docs/`; for files that legitimately live elsewhere (repo
files, `.boris/CONTEXT.md`), attach with `--ref` instead.

## Milestones

A feature too big for one build session becomes a parent card plus one child card
per milestone, each child with its own plan doc and acceptance criteria. /plan mints
the shape, in this order: park the parent in Build first, then create the children
in Plan (`--parent <parent-id> -s Plan`: without `-s` they land in the config's
`default_status`), chain them in sequence with `--dep`, and add every child as a
`--dep` on the parent in a single command, repeating `--dep` per child. The order
is load-bearing: once the child deps exist, the guard's dependency refusal blocks
any forward move of the parent. The parent stays parked in Build and reaches Done
only when every child is Done; the same refusal enforces it, and the parent's
subtask list is the roll-up. "Safe to start the next milestone" means the
dependency card is Done.

By default a plan's task tracker stays a checkbox list inside the plan doc; a unit
of work gets its own card only when it warrants its own context, acceptance
criteria, or docs (`--parent` for a slice of the feature, `--dep` for ordering).
/plan makes this call at planning time.

## Closeout

Closing a card (`-s Done`, guard-checked) records the outcome on the card:

- `--final-summary` carries Landed and Next.
- Left-over items route by their `reporting-findings.md` disposition: a Blocking
  item becomes a new card without asking; a Decide item becomes a card only after
  the user says yes; a Noted item becomes a note on the card.
- `partial` and `abandoned` labels go on only at the user's direction, with the
  reason in the final summary.

No archive move: Done cards and their docs stay where they are.

## Migrate on touch

The first time a skill picks up work that has live `.boris/` artifacts, convert it:
create the card, move each artifact into `backlog/docs/` (write the four-key
frontmatter, id = next free `doc-N`), attach them with one `--doc` call listing
every converted artifact, and delete the original paths. Convert only work actually
picked up; no bulk pass. `.boris/archive/` is frozen: never convert or move it.
`.boris/CONTEXT.md` and study docs are cross-ticket knowledge and `.boris/away/`
holds session decision logs, not work state; all three stay where they are.

## CLI coupling

Read card state only from `backlog task <id> --json`. The output wraps the card as
`{schemaVersion, kind, task}`; check the envelope's `schemaVersion` first: a value
other than 1 is a stop-and-report condition, not a guess-and-continue. From `task`,
consume only these fields: `title`, `description`, `status`, `labels`,
`dependencies`, `acceptanceCriteria`, `subtasks`, `documentation`,
`implementationNotes`, `finalSummary`, `parentTaskId`.

Every value flag on `backlog task edit` replaces its field rather than extending
it, so a command naming one value silently drops the values already there. Where
the intent is to add and the CLI has an additive sibling (`backlog task edit
--help` lists them; `--append-notes` for implementation notes), use it. Where the
intent is to replace or remove, or the flag has no sibling (`--doc` and `--dep`
have none), read the current value from the card's JSON and pass every value you
are keeping in one command, repeating the flag. A card note is an implementation
note: `--append-notes`, never `--notes`, which overwrites a `/handoff`'s state
unless replacing is the intent.

The CLI behavior this file asserts is probed, not documented; evidence:
`instruction-external-facts.md` §backlog.md CLI.

---
name: ship-notes
disable-model-invocation: true
description: >
  Draft the release notes for the current tag from merged PR titles. Invoke on
  "write the ship notes", "draft release notes". Skip when the tag has no new
  commits: report that and stop.
---

# Ship notes

Collect the PR titles merged since the previous tag and group them by area. The
`relnote` CLI rejects an empty body with exit 2 (probe), so never invoke it before
the draft exists.

Draft one line per change — user-facing wording, not commit subjects — and lead
with breaking changes.

Before ending any turn that changed the draft, write the delta to the ledger,
re-read the ledger back to confirm it landed, and name the delta in your reply.
(Ratified as a per-skill duty in the release-flow plan.)

Hand the draft to the user for approval; never publish it yourself.

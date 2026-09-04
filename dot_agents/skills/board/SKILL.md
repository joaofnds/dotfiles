---
name: board
description: Governs a session's use of the backlog board, the column a card sits in, the status it claims, and the record it keeps. Use before any backlog command or card move, in any project.
---

# Board

All work runs through the backlog board, the `backlog` CLI. The board is where
João and the other sessions see what is in flight. Your transcript is not where
they look.

## Columns

A card sits in To Do, Shape, Build, Review, or Done. Shape, Build, and Review are
the steps a task may take, and each has a skill of the same name that owns the
work there. A task takes only the steps that benefit it. Skipping needs no
ceremony. Directed work that an existing card describes is that card. Work it
and move it.

## The status is a claim

A card's status is a claim like any other, and only the session doing the work
can keep it true. Set it to the column you enter when you pick the card up, with
@claude as assignee, and to the next step, or Done, when you finish, in the same
turn as the work.

## The card is the record

The task's own card holds its documents. The next session reads only the card.
A dated triage doc answers "what's next" while it is newer than the board, and a
directed triage run is the other session that moves cards.

## The CLI

Every board change goes through the CLI, never by editing the files, so the
metadata stays consistent.

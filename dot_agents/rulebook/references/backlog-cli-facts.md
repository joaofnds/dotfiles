# Backlog CLI evidence

The board rule's CLI assumptions were recorded as checked against backlog.md
1.52.0 in DOT-80's implementation notes in the dotfiles backlog. That historical
record describes scratch-board checks of milestone filtering, priority ordering,
replacement flags, and the commands in the Syntax examples. Raw command outputs
are not retained here, so this record does not independently verify those claims.

Treat that record as unchecked rather than as checked at 1.52.0. Its replacement-flag
claim was false at that same version, where `--ac` and `--dod` add.

On a backlog.md upgrade, recheck those assumptions on a throwaway board against
the installed CLI before relying on them. Record the version, commands and raw
outputs with the result.

## Priority doc path

Checked 2026-09-24 on a scratch board against backlog.md 1.52.0 and the browser hub's
pinned 1.50.1. A doc file copied in as `backlog/docs/00-priority.md` with id
`priority` was renamed on its first `backlog doc update priority` to
`backlog/docs/doc-priority - 00-Priority.md` with id `doc-priority`, and a
`PUT /api/docs/priority` from `backlog browser` did the same. A file copied in as
`backlog/docs/doc-0 - 00-Priority.md` with id `doc-0` and title `00 Priority` kept its path through `backlog doc update doc-0` and through
`PUT /api/docs/doc-0` with a title in the body, on both versions. A later
`backlog doc create` took the next number after the highest one present. The browser
lists docs by title, so `00 Priority` sorts first.

Recheck on a backlog.md upgrade of either the CLI or the hub pin, by repeating those
four operations on a throwaway board and comparing the file names.

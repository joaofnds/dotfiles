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

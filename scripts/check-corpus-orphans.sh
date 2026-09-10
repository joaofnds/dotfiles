#!/usr/bin/env bash
# Finds rendered instruction files under ~/.agents that chezmoi no longer manages, so a
# file deleted from the source cannot keep loading from the target.
#
# chezmoi apply does not remove a target whose source is gone. An agent loads the target.
# A path .chezmoiignore excludes, such as an installed node_modules, is not an orphan.
#
# Usage: check-corpus-orphans.sh
# Exits 0 when every rendered file under ~/.agents has a source.
set -u

target="$HOME/.agents"

[ -d "$target" ] || { printf 'no %s to check\n' "$target"; exit 0; }

orphans="$(chezmoi unmanaged "$target")"

if [ -n "$orphans" ]; then
  printf 'rendered under ~/.agents with no chezmoi source:\n'
  printf '%s\n' "$orphans" | sed 's|^\.agents/|  |'
  printf '\ndelete each one, or restore its source.\n'
  exit 1
fi

printf 'every rendered corpus file has a source\n'

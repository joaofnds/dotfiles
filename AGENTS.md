# AGENTS.md

Project rules for this personal dotfiles repo, managed by
[chezmoi](https://github.com/twpayne/chezmoi). Rules under `~/.agents/` are a
separate concern (personal/per-machine, not this repo).

## Working in this repo

- This repo is chezmoi **source state**: `dot_config/nix/` → `~/.config/nix/`,
  `dot_*` → `~/.*`. Edit the source files here; don't hand-edit the rendered
  files under `$HOME` (chezmoi overwrites them). Apply with `chezmoi apply`.
- The repo root is the chezmoi source dir, so a plain root file (no `dot_`
  prefix) installs to `$HOME` — keep repo-only files in `.chezmoiignore`.
- After applying nix-darwin changes, rebuild:
  `darwin-rebuild switch --flake ~/.config/nix`.

## Conventions

- **Prefer typed nix-darwin options over the `CustomUserPreferences` escape
  hatch.** For macOS settings, use `system.defaults.<domain>.<key>` when
  nix-darwin models it (see `modules/system/defaults/` upstream); fall back to
  `CustomUserPreferences` only for unmodeled keys, with a comment noting why.
- **`CLAUDE.md` (and `GEMINI.md`) point at `AGENTS.md` and never fork it** — one
  instruction source per scope, never per-tool copies (a fork is a mirror that
  will drift; reverted one 2026-07-16). A symlink is the usual form
  (`symlink_CLAUDE.md.tmpl` in a `dot_claude*` source). The exception is this
  repo's own root `CLAUDE.md`: a one-line `@AGENTS.md` import, not a symlink.
  **Leave it an import** — the rule is satisfied because no copy exists, and
  converting it buys nothing.
- **Every root pointer file has a `.chezmoiignore` entry before it exists** —
  `CLAUDE.md` and `GEMINI.md` both carry one today, and the `GEMINI.md` entry
  stays whether or not the file does: adding the file later must not be able to
  install this repo's project rules as that tool's *global* instructions. The
  patterns are root-anchored, so ignoring `CLAUDE.md` leaves `.claude/CLAUDE.md`
  managed (checked with `chezmoi managed`, 2026-08-05).

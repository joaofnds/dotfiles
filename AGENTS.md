# AGENTS.md

Project rules for this personal dotfiles repo, managed by
[chezmoi](https://github.com/twpayne/chezmoi).

## Working in this repo

- This repo is chezmoi **source state**: `dot_config/nix/` → `~/.config/nix/`,
  `dot_*` → `~/.*`. Edit the source files here; don't hand-edit the rendered
  files under `$HOME` (chezmoi overwrites them). Apply with `chezmoi apply`.
- The repo root is the chezmoi source dir, so a plain root file (no `dot_`
  prefix) installs to `$HOME`; keep repo-only files in `.chezmoiignore`.
- After applying nix-darwin changes, rebuild:
  `darwin-rebuild switch --flake ~/.config/nix`.
- Domain terms: `GLOSSARY.md`.

## Conventions

- **Prefer typed nix-darwin options over the `CustomUserPreferences` escape
  hatch.** For macOS settings, use `system.defaults.<domain>.<key>` when
  nix-darwin models it (see `modules/system/defaults/` upstream); fall back to
  `CustomUserPreferences` only for unmodeled keys, with a comment noting why.
- **Keep one instruction source per scope, never per-tool copies**, because a
  copy drifts. Keep no root `CLAUDE.md` in this repo, since Claude Code loads
  `AGENTS.md` through the `instructionFiles` option in
  `dot_claude/private_settings.json`. A user-level `CLAUDE.md` in a
  `dot_claude*` source is a symlink to its source (`symlink_CLAUDE.md.tmpl`).
- **Every root pointer file has a `.chezmoiignore` entry before it exists**:
  `CLAUDE.md` and `GEMINI.md` both carry one, and each entry stays whether or
  not its file exists, so adding the file later cannot
  install this repo's project rules as that tool's *global* instructions. The
  patterns are root-anchored, so ignoring `CLAUDE.md` leaves `.claude/CLAUDE.md`
  managed. After editing `.chezmoiignore`, confirm `chezmoi managed` still
  lists `.claude/CLAUDE.md`.

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

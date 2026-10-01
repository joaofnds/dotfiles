#!/usr/bin/env bash
# Repairs what a macOS update undoes to nix-darwin. Safe to run any time.
set -euo pipefail

system=/nix/var/nix/profiles/system

# macOS recreates /run on update, dropping the current-system link.
if [[ "$(readlink /run/current-system || true)" != "$system" ]]; then
  echo "linking /run/current-system"
  sudo ln -sfn "$system" /run/current-system
fi

# macOS restores its stock /etc shell files over nix-darwin's links, and
# darwin-rebuild refuses to replace a file it does not recognize.
for static in /etc/static/*; do
  [[ -f "$static" ]] || continue
  name=$(basename "$static")
  if [[ -e "/etc/$name" && ! -L "/etc/$name" ]]; then
    echo "moving /etc/$name aside to /etc/$name.before-nix-darwin"
    sudo mv -f "/etc/$name" "/etc/$name.before-nix-darwin"
  fi
done

sudo "$system/sw/bin/darwin-rebuild" switch --flake ~/.config/nix

echo "done, open a new shell"

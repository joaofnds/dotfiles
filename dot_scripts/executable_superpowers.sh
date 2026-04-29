#!/bin/bash

REPO_URL="https://github.com/obra/superpowers.git"
TARGET_DIR="$HOME/.agents/skills"
AGENTS_DIR="$HOME/.agents/agents"
TEMP_REPO="/tmp/superpowers-source"

echo "Checking $TARGET_DIR"
mkdir -p "$TARGET_DIR"

echo "Removing existing superpowers skills..."
rg -l "name: superpowers:" "$TARGET_DIR" --no-ignore | while read -r skill_file; do
  rm -rf "$(dirname "$skill_file")"
done

if [ -d "$TEMP_REPO/.git" ]; then
  echo "Updating source repository..."
  git -C "$TEMP_REPO" pull --quiet
else
  echo "Cloning Superpowers repository..."
  git clone --depth 1 "$REPO_URL" "$TEMP_REPO" --quiet
fi

echo "Copying skills..."
cp -r "$TEMP_REPO/skills/"* "$TARGET_DIR/"

echo "Updating skill names..."
for skill_path in "$TEMP_REPO/skills"/*; do
  skill_name=$(basename "$skill_path")
  skill_file="$TARGET_DIR/$skill_name/SKILL.md"
  if [ -f "$skill_file" ]; then
    sed -i '' 's/name: /name: superpowers:/g' "$skill_file"
  fi
done

echo "Removing existing superpowers agents..."
mkdir -p "$AGENTS_DIR"
rg -l "name: superpowers:" "$AGENTS_DIR" --no-ignore | while read -r agent_file; do
  rm -f "$agent_file"
done

echo "Copying agents..."
cp "$TEMP_REPO/agents/"* "$AGENTS_DIR/"

echo "Updating agent names..."
for agent_file in "$TEMP_REPO/agents"/*; do
  agent_name=$(basename "$agent_file")
  dest="$AGENTS_DIR/$agent_name"
  if [ -f "$dest" ]; then
    sed -i '' 's/name: /name: superpowers:/g' "$dest"
  fi
done

echo "Success: $(ls "$TEMP_REPO/skills" | wc -l | xargs) skills and $(ls "$TEMP_REPO/agents" | wc -l | xargs) agents are now installed"

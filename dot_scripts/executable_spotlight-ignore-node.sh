#!/usr/bin/env sh

BUDDY=/usr/libexec/PlistBuddy
PLIST_FILE="/System/Volumes/Data/.Spotlight-V100/VolumeConfiguration.plist"

sudo $BUDDY -c "Delete :Exclusions" "$PLIST_FILE"
sudo $BUDDY -c "Add :Exclusions array"  "$PLIST_FILE"

fd \
  --type directory \
  --fixed-strings \
  --absolute-path \
  --prune \
  node_modules \
  --exec sudo $BUDDY \
    -c "Add :Exclusions: string {}" \
    "$PLIST_FILE"

sudo launchctl stop com.apple.metadata.mds
sudo launchctl start com.apple.metadata.mds

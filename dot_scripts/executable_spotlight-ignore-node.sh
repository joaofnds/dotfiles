#!/usr/bin/env sh

sudo /usr/libexec/PlistBuddy -c "Delete :Exclusions" /System/Volumes/Data/.Spotlight-V100/VolumeConfiguration.plist
sudo /usr/libexec/PlistBuddy -c "Add :Exclusions array" /System/Volumes/Data/.Spotlight-V100/VolumeConfiguration.plist

sudo fd \
  --type directory \
  --fixed-strings \
  --absolute-path \
  --prune \
  node_modules \
  --exec /usr/libexec/PlistBuddy \
    -c "Add :Exclusions: string {}" \
    /System/Volumes/Data/.Spotlight-V100/VolumeConfiguration.plist

sudo launchctl stop com.apple.metadata.mds
sudo launchctl start com.apple.metadata.mds

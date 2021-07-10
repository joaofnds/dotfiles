#!/usr/bin/env sh
set -euo pipefail

TEMP_DIR="/tmp/alacritty-terminfo"

mkdir "$TEMP_DIR"
pushd "$TEMP_DIR"

echo "[info] downloading alacritty.info from alacritty github repo"
curl -sO https://raw.githubusercontent.com/alacritty/alacritty/master/extra/alacritty.info
echo "[info] compiling alacritty.info under 'alacritty' name"
sudo tic -xe alacritty alacritty.info

echo "[info] cleaning up"
popd
rm "$TEMP_DIR/alacritty.info"
rmdir $TEMP_DIR

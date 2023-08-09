#!/usr/bin/env sh

# ensure docker is running
docker ps >/dev/null || exit 1

PREV_PWD=$(pwd)

VERSION="26.0.2"
RELEASE_URL="https://github.com/be5invis/Iosevka/releases/download/v$VERSION/ttf-iosevka-ss08-$VERSION.zip"

TEMPDIR=$(mktemp -d)
pushd $TEMPDIR

curl -Lo ./iosevka.zip "$RELEASE_URL"
unzip iosevka.zip

mkdir in out
mv *.ttf in

docker run \
  --rm \
  -v $(pwd)/in:/in \
  -v $(pwd)/out:/out nerdfonts/patcher \
  --complete \
  --use-single-width-glyphs

mkdir $PREV_PWD/patched-iosevka
mv out/* $PREV_PWD/patched-iosevka

popd
rm -rf "$TEMPDIR"

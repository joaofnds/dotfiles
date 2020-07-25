#!/usr/bin/env bash

JQ_EACH_VIDEO='.contents.twoColumnBrowseResultsRenderer.tabs[0].tabRenderer.content.sectionListRenderer.contents[0].itemSectionRenderer.contents[0].playlistVideoListRenderer.contents[].playlistVideoRenderer'
JQ_URL_AND_TITLE="$JQ_EACH_VIDEO | \"https://youtube.com\" + .navigationEndpoint.commandMetadata.webCommandMetadata.url + \"\t\" + .title.simpleText"

read -r -d '' BBSCRIPT <<EOS
  (defn split [s]
    (str/split s #" = "))

  (defn remove-trailing-semicolon [s]
    (apply str (remove (partial = \;) s)))

  (->>
    *input*
    first
    split
    second
    remove-trailing-semicolon
    println)
EOS

curl -s $1 |
  grep  'ytInitialData' |
  bb -i "$BBSCRIPT" |
  jq -r "$JQ_URL_AND_TITLE"

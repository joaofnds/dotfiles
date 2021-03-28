#!/usr/bin/env bash

yt_data=$(curl -s $1)
yt_data="${yt_data##*var ytInitialData = }"
yt_data="${yt_data%%;*}"

JQ_EACH_VIDEO='.contents.twoColumnBrowseResultsRenderer.tabs[0].tabRenderer.content.sectionListRenderer.contents[0].itemSectionRenderer.contents[0].playlistVideoListRenderer.contents[].playlistVideoRenderer'
JQ_URL_AND_TITLE="$JQ_EACH_VIDEO | \"https://youtube.com\" + .navigationEndpoint.commandMetadata.webCommandMetadata.url + \"\t\" + .title.runs[0].text"

jq -r "$JQ_URL_AND_TITLE" <<< "$yt_data"

#!/usr/bin/env bash

sleep 5 # wait for results updates

HOME=$(eval echo "~$joaofnds")
CACHEDIR="$HOME/.cache"
source "$HOME/.private.env"

PRESIDENTCACHE="$CACHEDIR/president.json"
GOVERNORCACHE="$CACHEDIR/governor.json"

filter='"apurados: \(.pesi)% (\(.c) votos)\\n"+ (.cand | map("\(.nm): \(.pvap)% (\(.vap) votos)") | join("\\n"))'
president=$(jq -r "$filter" <"$PRESIDENTCACHE")
governor=$(jq -r "$filter" <"$GOVERNORCACHE")

results=$(tr '[:upper:]' '[:lower:]' <<<"presidente:\n$president\n\ngovernador:\n$governor")

president_finished=$(jq '.pesi == "100,00"' <"$PRESIDENTCACHE")
governor_finished=$(jq '.pesi == "100,00"' <"$GOVERNORCACHE")

if [ "$president_finished" == "true" ] && [ "$governor_finished" == "true" ]; then
    grep '100' &>/dev/null <<<"$results" && crontab -l | sed '/electionbot.sh/d' | crontab
    exit 0
fi

curl -s -X POST \
    -H "Content-Type: application/json" \
    -d "{\"content\": \"$results\"}" \
    "$ELECTIONBOT_URL"

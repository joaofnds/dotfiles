#!/usr/bin/env bash

HOME=$(eval echo "~$joaofnds")
source "$HOME/.private.env"

JOKE=$(curl -s -H "X-Rapidapi-Key: $RAPIDAPI_KEY" -H "X-Rapidapi-Host: dad-jokes.p.rapidapi.com" https://dad-jokes.p.rapidapi.com/random/joke)

setup=$(jq -r '.body[0].setup' <<<"$JOKE")
punchline=$(jq -r '.body[0].punchline' <<<"$JOKE")

curl -s -X POST \
	-H "Content-Type: application/json" \
	-d "{\"content\": \"$setup\"}" \
	"$DADBOT_URL"

sleep 20

curl -s -X POST \
	-H "Content-Type: application/json" \
	-d "{\"content\": \"$punchline\"}" \
	"$DADBOT_URL"

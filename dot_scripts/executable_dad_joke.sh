#!/usr/bin/env bash

HOME=$(eval echo "~$joaofnds")
source "$HOME/.private.env"

function send_joke() {
	curl -s -X POST \
		-H "Content-Type: application/json" \
		-d "{\"content\": \"$1\"}" \
		"$DADBOT_URL"
}

joke=$(curl -s -H "X-Rapidapi-Key: $RAPIDAPI_KEY" -H "X-Rapidapi-Host: dad-jokes.p.rapidapi.com" "https://dad-jokes.p.rapidapi.com/random/joke")

send_joke "$(jq -r '.body[0].setup' <<<"$joke")"
sleep 20
send_joke "$(jq -r '.body[0].punchline' <<<"$joke")"

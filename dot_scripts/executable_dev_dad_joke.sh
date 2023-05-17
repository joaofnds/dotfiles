#!/usr/bin/env bash

HOME=$(eval echo "~$joaofnds")
source "$HOME/.private.env"

function send() {
	curl -s -X POST \
		-H "Content-Type: application/json" \
		-d "{\"content\": \"$1\"}" \
		"$DADBOT_URL"
}

joke=$(curl -s https://v2.jokeapi.dev/joke/Programming)

type=$(jq -r '.type' <<<"$joke")
if [ "$type" == "single" ]; then
	send "$(jq -r '.joke' <<<"$joke")"
else
	send "$(jq -r '.setup' <<<"$joke")"
	sleep 20
	send "$(jq -r '.delivery' <<<"$joke")"
fi

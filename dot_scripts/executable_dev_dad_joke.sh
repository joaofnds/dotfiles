#!/usr/bin/env bash

HOME=$(eval echo "~$joaofnds")
source "$HOME/.private.env"

function send() {
	curl -s -X POST \
		-H "Content-Type: application/json" \
		-d "{\"content\": \"$1\"}" \
		"$DADBOT_URL"
}

JOKE=$(curl -s https://v2.jokeapi.dev/joke/Programming)

type=$(jq -r '.type' <<<"$JOKE")
if [ "$type" == "single" ]; then
	send "$(jq -r '.joke' <<<"$JOKE")"
else
	send "$(jq -r '.setup' <<<"$JOKE")"
	sleep 5
	send "$(jq -r '.delivery' <<<"$JOKE")"
fi

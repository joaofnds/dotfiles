#!/usr/bin/env sh

HOME=$(eval echo "~$joaofnds")
source "$HOME/.hardware.env"

WEEK=$(date +"%U")

curl -s -X POST \
    -H "Content-Type: application/json" \
    -d "{\"content\": \"Oficialmente iniciada a semana $WEEK do ano! Uma ótima semana a todos!\"}" \
    "$DOMINGOBOT_URL"

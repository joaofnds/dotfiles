#!/usr/bin/env bash

HOME=$(eval echo "~$joaofnds")
source "$HOME/.private.env"

curl -s -X POST \
    -H "Content-Type: application/json" \
    -d "{\"content\": \"então tá pessoal, tchau tchau!\"}" \
    "$STANLEY_5PM_BOT_URL"

curl -s -X POST \
    -H "Content-Type: application/json" \
    -d "{\"content\": \"https://tenor.com/view/the-office-stanley-time-to-go-work-life-got-to-go-gif-4242766\"}" \
    "$STANLEY_5PM_BOT_URL"

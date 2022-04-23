#!/usr/bin/env sh

curl -sf "rate.sx/1btc" | awk '{ printf("$%.1fk", $0/1000) }' >"$HOME/.cache/btc-usd-rate"

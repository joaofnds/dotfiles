#!/usr/bin/env sh

curl -sf "rate.sx/1xlm" | awk '{ printf("$%.1fk", $0/1000) }' >"$HOME/.cache/xlm-usd-rate"

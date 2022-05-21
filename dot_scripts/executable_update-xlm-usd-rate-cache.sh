#!/usr/bin/env sh

curl -sf "rate.sx/1xlm" | awk '{ printf("$%.2f", $0) }' >"$HOME/.cache/xlm-usd-rate"

#!/usr/bin/env sh

curl -sf "rate.sx/1btc" | awk '{ printf("$%.1fk", $0/1000) }' >"$HOME/.cache/btc-usd-rate"
curl -sf "rate.sx/1xlm" | awk '{ printf("$%.2f", $0) }' >"$HOME/.cache/xlm-usd-rate"
curl -sf "rate.sx/1eth" | awk '{ printf("$%.1fk", $0/1000) }' >"$HOME/.cache/eth-usd-rate"

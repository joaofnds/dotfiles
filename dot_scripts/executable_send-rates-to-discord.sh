#!/usr/bin/env bash

HOME=$(eval echo "~$joaofnds")
CACHEDIR="$HOME/.cache"

source "$HOME/.private.env"

USD=$(cat "$CACHEDIR/usd-brl-rate")
EUR=$(cat "$CACHEDIR/eur-brl-rate")
ARS=$(cat "$CACHEDIR/ars-brl-rate")
BTC=$(cat "$CACHEDIR/btc-usd-rate")
ETH=$(cat "$CACHEDIR/eth-usd-rate")

URL=$PAI_RICO_WEBHOOK_URL
if (( $(bc <<<"${USD:2} < 5.20") )); then
  URL=$PAI_POBRE_WEBHOOK_URL
fi

curl -s -X POST \
    -H "Content-Type: application/json" \
    -d "{\"content\": \"USD: $USD\nEUR: $EUR\nARS: $ARS\nBTC: $BTC\nETH: $ETH\"}" \
    "$URL"

#!/usr/bin/env sh

HOME=$(eval echo "~$joaofnds")
CACHEDIR="$HOME/.cache"

source "$HOME/.hardware.env"

USD=$(cat "$CACHEDIR/usd-brl-rate")
EUR=$(cat "$CACHEDIR/eur-brl-rate")
ARS=$(cat "$CACHEDIR/ars-brl-rate")
BTC=$(cat "$CACHEDIR/btc-usd-rate")
ETH=$(cat "$CACHEDIR/eth-usd-rate")

curl -s -X POST \
    -H "Content-Type: application/json" \
    -d "{\"content\": \"USD: $USD\nEUR: $EUR\nARS: $ARS\nBTC: $BTC\nETH: $ETH\"}" \
    "$PAI_RICO_WEBHOOK_URL"

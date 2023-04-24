#!/usr/bin/env sh

body=$(mktemp)

curl --silent \
	--output "$body" \
	--header "X-CMC_PRO_API_KEY: $COINMARKETCAP_KEY" \
	"https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?symbol=BTC,ETH,XLM"

jq '.data.BTC.quote.USD.price' "$body" | awk '{ printf("$%.1fk", $0/1000) }' >"$HOME/.cache/btc-usd-rate"
jq '.data.ETH.quote.USD.price' "$body" | awk '{ printf("$%.1fk", $0/1000) }' >"$HOME/.cache/eth-usd-rate"
jq '.data.XLM.quote.USD.price' "$body" | awk '{ printf("$%.2f", $0) }' >"$HOME/.cache/xlm-usd-rate"

#!/usr/bin/env sh

/usr/bin/curl -s "https://api.exchangeratesapi.io/latest?base=USD" |
  jq '.rates.BRL' |
  awk '{ printf("💹%.2f", $0) }' > ~/.cache/USD-BRL-rate

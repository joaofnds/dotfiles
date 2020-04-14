#!/usr/bin/env sh

/usr/bin/curl -s "https://api.exchangeratesapi.io/latest?base=USD" |
  /usr/local/bin/jq '.rates.BRL' |
  /usr/local/bin/awk '{ printf("💹%.2f", $0) }' > /Users/joaofnds/.cache/usd-brl-rate

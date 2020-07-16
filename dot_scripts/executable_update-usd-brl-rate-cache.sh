#!/usr/bin/env sh

HOME=$(eval echo "~$joaofnds")

curl -s "https://api.exchangeratesapi.io/latest?base=USD" |
  jq '.rates.BRL' |
  awk '{ printf("💹%.2f", $0) }' > $HOME/.cache/usd-brl-rate

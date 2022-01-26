#!/usr/bin/env sh

HOME=$(eval echo "~$joaofnds")

curl -s "rate.sx/1btc" | awk '{ printf("$%.1fk", $0/1000) }' > $HOME/.cache/btc-usd-rate

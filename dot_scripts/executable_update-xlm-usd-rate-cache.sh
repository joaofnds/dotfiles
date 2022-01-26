#!/usr/bin/env sh

HOME=$(eval echo "~$joaofnds")

curl -s "rate.sx/1xlm" | awk '{ printf("$%.2g", $0) }' > $HOME/.cache/xlm-usd-rate

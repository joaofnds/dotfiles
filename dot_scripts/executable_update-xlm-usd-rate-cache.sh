#!/usr/bin/env sh

HOME=$(eval echo "~$joaofnds")
outfile=$HOME/.cache/xlm-usd-rate

rate=$(curl -sf "rate.sx/1xlm")
if [[ $? = 0 ]]; then
    awk '{ printf("$%.1fk", $0/1000) }' <<< $rate > $outfile
else
    printf '' > $outfile
fi

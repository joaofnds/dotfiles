#!/usr/bin/env sh

HOME=$(eval echo "~$joaofnds")

source "$HOME/.hardware.env"

RESPONSE=$(curl -s "http://api.exchangeratesapi.io/v1/latest?access_key=$EXCHANGERATESAPI_TOKEN")
USD=$(jq -r '.rates.USD' <<< $RESPONSE)
BRL=$(jq -r '.rates.BRL' <<< $RESPONSE)
bc -l <<< "1.0 / $USD * $BRL" | awk '{ printf("R$%.4f", $0) }' > $HOME/.cache/usd-brl-rate

#!/usr/bin/env sh

HOME=$(eval echo "~$joaofnds")
CACHEDIR="$HOME/.cache"
RATESCACHE="$CACHEDIR/rates.json"

source "$HOME/.private.env"

curl -s "http://api.exchangeratesapi.io/v1/latest?access_key=$EXCHANGERATESAPI_TOKEN" -o "$RATESCACHE"

BRL=$(jq -r '.rates.BRL' < "$RATESCACHE")
USD=$(jq -r '.rates.USD' < "$RATESCACHE")
EUR=$(jq -r '.rates.EUR' < "$RATESCACHE")
ARS=$(jq -r '.rates.ARS' < "$RATESCACHE")

bc -l <<< "1.0 / $EUR * $BRL" | awk '{ printf("R$%.2f", $0) }' > "$CACHEDIR/eur-brl-rate"
bc -l <<< "1.0 / $USD * $BRL" | awk '{ printf("R$%.2f", $0) }' > "$CACHEDIR/usd-brl-rate"
bc -l <<< "1.0 / $ARS * $BRL" | awk '{ printf("R$%.4f", $0) }' > "$CACHEDIR/ars-brl-rate"

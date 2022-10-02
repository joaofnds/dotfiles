#!/usr/bin/env bash

HOME=$(eval echo "~$joaofnds")
source "$HOME/.hardware.env"

url="https://resultados.tse.jus.br/oficial/ele2022/544/dados-simplificados/br/br-c0001-e000544-r.json"

filter='"apurados: \(.pesi)%\n"+(.cand[:2] | map("\(.nm): \(.pvap)%") | join("\n")) | tojson'
results=$(curl -s "$url" | jq -r "$filter" | tr '[:upper:]' '[:lower:]')

curl -s -X POST \
    -H "Content-Type: application/json" \
    -d "{\"content\": $results}" \
    "$ELECTIONBOT_URL"

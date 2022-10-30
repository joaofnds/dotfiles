#!/usr/bin/env bash

HOME=$(eval echo "~$joaofnds")
CACHE="$HOME/.cache/governor.json"

curl "https://resultados.tse.jus.br/oficial/ele2022/547/dados-simplificados/rs/rs-c0003-e000547-r.json" \
    --silent \
    --output "$CACHE"

grep '100' &>/dev/null <"$CACHE" && crontab -l | sed '/election_governor.sh/d' | crontab

#!/usr/bin/env bash

HOME=$(eval echo "~$joaofnds")
CACHE="$HOME/.cache/president.json"

curl "https://resultados.tse.jus.br/oficial/ele2022/545/dados-simplificados/br/br-c0001-e000545-r.json" \
    --silent \
    --output "$CACHE"

grep '100' &>/dev/null <"$CACHE" && crontab -l | sed '/election_president.sh/d' | crontab

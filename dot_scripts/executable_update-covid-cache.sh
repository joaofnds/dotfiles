#!/usr/bin/env sh

set -e

HOME=$(eval echo "~$joaofnds")

curl -s https://corona.lmao.ninja/v2/countries/brazil |
  jq '["💀", .deaths, "(", .todayDeaths, ") 🦠", .active, "(", .todayCases, ")"] | join("")' |
  tr -d "\"\n" > $HOME/.cache/covid

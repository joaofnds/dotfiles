#!/usr/bin/env sh

curl -s https://corona.lmao.ninja/countries/brazil |
  jq '["💀", .deaths, "(", .todayDeaths, ") 🦠", .active, "(", .todayCases, ")"] | join("")' |
  tr -d "\"" > ~/.cache/covid

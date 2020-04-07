#!/usr/bin/env sh

set -e

/usr/bin/curl -s https://corona.lmao.ninja/countries/brazil |
  /usr/local/bin/jq '["💀", .deaths, "(", .todayDeaths, ") 🦠", .active, "(", .todayCases, ")"] | join("")' |
  /usr/bin/tr -d "\"" > /Users/joaofnds/.cache/covid

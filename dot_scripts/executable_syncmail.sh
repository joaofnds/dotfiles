#!/usr/bin/env sh

echo "[$(date -R)] INFO: started mbsync"
mbsync -aq
echo "[$(date -R)] INFO: ended mbsync"

echo "[$(date -R)] INFO: started notmuch-new"
notmuch new
echo "[$(date -R)] INFO: ended notmuch-new\n\n"

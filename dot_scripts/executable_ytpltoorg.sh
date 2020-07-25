#!/usr/bin/env bash

awk -F $'\t' '{ print "[[" $1 "][" $2 "]]" }'

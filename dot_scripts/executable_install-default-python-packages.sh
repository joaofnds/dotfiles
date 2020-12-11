#!/usr/bin/env bash

set -euo pipefail

pip install black 'python-language-server[all]' pyls-black

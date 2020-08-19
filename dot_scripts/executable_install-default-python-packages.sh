#!/usr/bin/env bash

set -euo pipefail

pip install black docker 'python-language-server[all]' pyls-black

#!/usr/bin/env bash

set -euo pipefail

pip install --user black 'python-language-server[all]' pyls-black afew

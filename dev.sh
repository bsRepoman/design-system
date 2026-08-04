#!/bin/bash
set -e
cd "$(dirname "$0")"
export PATH="$HOME/.nvm/versions/node/v24.18.0/bin:$PATH"
exec npm run dev

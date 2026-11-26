#!/usr/bin/env bash
set -euo pipefail

PORT="${1:-4173}"
cd "$(dirname "$0")"

echo "APEX Circuit 01 -> http://localhost:$PORT"
python3 -m http.server "$PORT"

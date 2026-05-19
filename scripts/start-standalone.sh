#!/bin/sh
set -e
# Next standalone debe ejecutarse desde su carpeta (paths a static/public).
cd "$(dirname "$0")/../.next/standalone"
export HOSTNAME="${HOSTNAME:-0.0.0.0}"
export PORT="${PORT:-3015}"
exec node server.js

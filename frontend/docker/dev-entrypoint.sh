#!/bin/sh

set -eu

cd /app

if [ ! -d node_modules ] || [ ! -f node_modules/.package-lock.json ] || ! cmp -s package-lock.json node_modules/.package-lock.json; then
  echo "Installing frontend dependencies..."
  npm ci
fi

exec npm run start:docker

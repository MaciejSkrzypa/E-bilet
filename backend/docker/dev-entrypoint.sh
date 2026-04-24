#!/usr/bin/env bash

set -euo pipefail

cd /app
chmod +x mvnw

compute_state() {
  {
    if [[ -f pom.xml ]]; then
      stat -c '%n %Y' pom.xml
    fi

    for path in src/main/java src/main/resources; do
      if [[ -d "$path" ]]; then
        find "$path" -type f -print0
      fi
    done | xargs -0r stat -c '%n %Y'
  } | sort | sha256sum | awk '{print $1}'
}

watch_and_compile() {
  local last_state
  local current_state

  last_state="$(compute_state)"

  while true; do
    sleep 1
    current_state="$(compute_state)"

    if [[ "$current_state" != "$last_state" ]]; then
      echo "Detected backend change. Recompiling sources..."
      last_state="$current_state"
      ./mvnw -q -DskipTests compile || true
    fi
  done
}

./mvnw -q -DskipTests dependency:go-offline
watch_and_compile &
WATCHER_PID=$!

cleanup() {
  kill "$WATCHER_PID" 2>/dev/null || true
}

trap cleanup EXIT INT TERM

exec ./mvnw -DskipTests spring-boot:run \
  -Dspring-boot.run.fork=true \
  -Dspring-boot.run.jvmArguments="-Dspring.devtools.restart.enabled=true"

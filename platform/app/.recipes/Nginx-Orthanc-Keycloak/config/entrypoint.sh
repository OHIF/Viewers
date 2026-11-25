#!/bin/sh

# oauth2-proxy discovers Keycloak through this container's nginx at startup,
# so it fails until nginx is listening. Rerun it after an error exit. After 30
# quick failures in a row (a configuration error, not the startup race), stop
# the container, so that the failure shows in `docker compose ps`.
(tries=0
until start=$(date +%s); oauth2-proxy --config=/etc/oauth2-proxy/oauth2-proxy.cfg; do
  # A run longer than a minute was a crash after a good start: count again from 0.
  [ $(($(date +%s) - start)) -gt 60 ] && tries=0
  tries=$((tries + 1))
  if [ "$tries" -ge 30 ]; then
    echo "oauth2-proxy failed $tries times; stopping the container. Check config/oauth2-proxy.cfg."
    kill 1
    exit 1
  fi
  echo "oauth2-proxy exited; retry $tries of 30 in 2s"
  sleep 2
done) &

exec nginx -g "daemon off;"

#!/bin/sh

# oauth2-proxy discovers Keycloak through this container's nginx at startup,
# so it fails until nginx is listening. Rerun it until it starts, and again
# whenever it exits with an error. A clean exit (such as a manual SIGTERM) is
# not restarted: restart the container to bring it back.
(until oauth2-proxy --config=/etc/oauth2-proxy/oauth2-proxy.cfg; do
  echo "oauth2-proxy exited; retrying in 2s"
  sleep 2
done) &

exec nginx -g "daemon off;"

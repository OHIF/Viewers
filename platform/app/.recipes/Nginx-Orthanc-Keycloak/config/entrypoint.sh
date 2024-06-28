#!/bin/sh

# Start oauth2-proxy
oauth2-proxy --config=/etc/oauth2-proxy/oauth2-proxy.cfg &

# Start nginx
nginx -g "daemon off;"

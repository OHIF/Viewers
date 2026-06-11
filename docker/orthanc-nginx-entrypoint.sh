#!/bin/sh
# MIMPS-05 — renders docker/orthanc-nginx.conf.template into the active nginx
# config, computing the Basic auth header from ORTHANC_USERNAME/ORTHANC_PASSWORD
# so no base64 value has to be maintained in .env by hand.
#
# Mounted into the official nginx image at:
#   /docker-entrypoint.d/15-render-pacs-conf.sh
# (runs before nginx starts; the stock 20-envsubst script is not used because
# our template lives outside /etc/nginx/templates).
set -eu

: "${ORTHANC_PASSWORD:?ORTHANC_PASSWORD must be set (see .env.example)}"

ORTHANC_AUTH_B64="$(printf '%s:%s' "${ORTHANC_USERNAME:-mimps}" "${ORTHANC_PASSWORD}" | base64 | tr -d '\n')"
export ORTHANC_AUTH_B64
export MIMPS_VIEWER_ORIGIN="${MIMPS_VIEWER_ORIGIN:-http://localhost:3000}"

envsubst '${ORTHANC_AUTH_B64} ${MIMPS_VIEWER_ORIGIN}' \
  < /opt/mimps/orthanc-nginx.conf.template \
  > /etc/nginx/conf.d/default.conf

echo "[orthanc-nginx] rendered /etc/nginx/conf.d/default.conf (viewer origin: ${MIMPS_VIEWER_ORIGIN})"

#!/usr/bin/env bash
# =============================================================================
# MIMPS-05 / MIMPS-06 / MIMPS-07 — VPS runbook for the Orthanc DICOM backend.
#
# Run this ON THE VPS (Lightsail, Ubuntu 24.04, Docker + Compose installed).
# It is idempotent and safe to re-run: every step checks its own precondition.
#
#   ssh ubuntu@18.211.23.100
#   cd /home/ubuntu/blackvoxel/projects/2_mimps
#   sudo ./scripts/vps-orthanc-runbook.sh          # needs root for nginx + reload
#
# What it does:
#   1. Sanity-check the repo + .env (ORTHANC_PASSWORD etc).
#   2. Bring up the Orthanc + orthanc-nginx gateway compose stack.
#   3. Wire the HOST nginx /pacs/ proxy -> 127.0.0.1:8899 (the gateway).
#   4. Ingest the 5 de-identified demo chest X-rays (MIMPS-06).
#   5. Verify everything with curl.
#
# NOTE ON PORTS: docker-compose binds Orthanc (8042/4242) and the gateway (8899)
# to 127.0.0.1 only. The ONLY public path to the PACS is the host nginx /pacs/
# location on viewer.blackvoxel.ai, which sits behind the viewer's auth gate.
# =============================================================================
set -euo pipefail

REPO_DIR="${REPO_DIR:-/home/ubuntu/blackvoxel/projects/2_mimps}"
GATEWAY_UPSTREAM="127.0.0.1:8899"          # orthanc-nginx (CORS + Basic auth injection)
ORTHANC_LOOPBACK="http://127.0.0.1:8042"   # Orthanc REST, loopback-only (admin/ingest)
VIEWER_SERVER_NAME="viewer.blackvoxel.ai"
NGINX_SNIPPET="/etc/nginx/snippets/mimps-pacs.conf"

log() { printf '\n\033[1;34m==> %s\033[0m\n' "$*"; }
die() { printf '\n\033[1;31mERROR: %s\033[0m\n' "$*" >&2; exit 1; }

cd "$REPO_DIR" || die "repo not found at $REPO_DIR (set REPO_DIR=...)"

# -----------------------------------------------------------------------------
# 1. Preconditions: .env with the required secrets.
# -----------------------------------------------------------------------------
log "Checking .env"
[ -f .env ] || die "missing $REPO_DIR/.env — copy .env.example and set ORTHANC_PASSWORD, MIMPS_VIEWER_ORIGIN=https://${VIEWER_SERVER_NAME}"
# shellcheck disable=SC1091
set -a; . ./.env; set +a
[ -n "${ORTHANC_PASSWORD:-}" ] || die "ORTHANC_PASSWORD is empty in .env"
ORTHANC_USERNAME="${ORTHANC_USERNAME:-mimps}"
if [ "${MIMPS_VIEWER_ORIGIN:-}" != "https://${VIEWER_SERVER_NAME}" ]; then
  echo "WARNING: MIMPS_VIEWER_ORIGIN is '${MIMPS_VIEWER_ORIGIN:-unset}', expected https://${VIEWER_SERVER_NAME}"
  echo "         (CORS header on the gateway will use that origin; fix .env if wrong, then re-run)"
fi

# -----------------------------------------------------------------------------
# 2. Bring up the compose stack (idempotent — compose reconciles to desired state).
# -----------------------------------------------------------------------------
log "Starting Orthanc + gateway (docker compose up -d)"
docker compose up -d

log "Waiting for Orthanc to become healthy"
for i in $(seq 1 40); do
  status="$(docker inspect -f '{{.State.Health.Status}}' mimps-orthanc 2>/dev/null || echo starting)"
  echo "  orthanc health: $status"
  [ "$status" = "healthy" ] && break
  [ "$i" = "40" ] && die "Orthanc did not become healthy — check: docker compose logs orthanc"
  sleep 3
done

# -----------------------------------------------------------------------------
# 3. Host nginx /pacs/ proxy block.
#
#    The host nginx serves the viewer dist for ${VIEWER_SERVER_NAME}. We add a
#    /pacs/ location that forwards the *unmodified* URI (note: no path on
#    proxy_pass, so /pacs/... is preserved) to the orthanc-nginx gateway, which
#    strips /pacs/ and injects Orthanc Basic credentials before reaching Orthanc.
#
#    The exact location blocks are in the heredoc below.
#
#    AUTH (INT-05): /pacs/ carries `auth_request` against the audit-service
#    (mimps-audit.service, 127.0.0.1:8080), which validates platform RS256
#    JWTs via JWKS. This satisfies the gateway SECURITY NOTE (auth in front
#    before proxying); the MIMPS-15 htpasswd gate is retired. The audit-service
#    must be running or every /pacs/ request fails 500/502 (fail-closed).
# -----------------------------------------------------------------------------
log "Writing host nginx /pacs/ snippet -> ${NGINX_SNIPPET}"
install -d -m 0755 "$(dirname "$NGINX_SNIPPET")"
cat > "$NGINX_SNIPPET" <<'NGINX'
# MIMPS-05 — proxy /pacs/ to the on-box orthanc-nginx gateway (127.0.0.1:8899).
# INT-05 — /pacs/ is JWT-gated via auth_request against the audit-service
# (mimps-audit.service on 127.0.0.1:8080). The htpasswd gate is retired; a
# platform (blackvoxel.ai) JWT — Bearer header or blackvoxel_jwt cookie set by
# the viewer's jwtBridge — is the only credential.
# Managed by scripts/vps-orthanc-runbook.sh — edits here are overwritten on re-run.
location /pacs/ {
    auth_request /_mimps_auth_verify;

    # Preserve the /pacs/ prefix: the gateway strips it (proxy_pass .../ ).
    proxy_pass         http://127.0.0.1:8899;
    proxy_http_version 1.1;
    proxy_set_header   Host              $host;
    proxy_set_header   X-Real-IP         $remote_addr;
    proxy_set_header   X-Forwarded-For   $proxy_add_x_forwarded_for;
    proxy_set_header   X-Forwarded-Proto $scheme;
    client_max_body_size 512M;
    proxy_buffering    off;
}

# Internal auth_request subrequest target — not reachable from outside.
location = /_mimps_auth_verify {
    internal;
    proxy_pass              http://127.0.0.1:8080/auth/verify;
    proxy_pass_request_body off;
    proxy_set_header        Content-Length "";
    proxy_set_header        Host           $host;
    proxy_set_header        Authorization  $http_authorization;
    proxy_set_header        Cookie         $http_cookie;
}
NGINX

# Find the host site config that owns ${VIEWER_SERVER_NAME} and ensure it
# includes the snippet. Idempotent: only inserts the include once.
SITE_CONF="$(grep -RIl "server_name[[:space:]].*${VIEWER_SERVER_NAME}" /etc/nginx 2>/dev/null | head -n1 || true)"
if [ -z "$SITE_CONF" ]; then
  echo "WARNING: no nginx server block for ${VIEWER_SERVER_NAME} found under /etc/nginx."
  echo "         The viewer site may not be configured yet (INT-07). Add this line inside"
  echo "         the HTTPS server block for ${VIEWER_SERVER_NAME}, then 'nginx -t && systemctl reload nginx':"
  echo "             include ${NGINX_SNIPPET};"
else
  echo "  viewer site config: $SITE_CONF"
  if grep -q "include ${NGINX_SNIPPET};" "$SITE_CONF"; then
    echo "  include already present — nothing to do"
  else
    # Insert the include immediately after the matching server_name line.
    cp -a "$SITE_CONF" "${SITE_CONF}.mimps.bak.$(date +%Y%m%d%H%M%S)"
    awk -v inc="    include ${NGINX_SNIPPET};" -v sn="${VIEWER_SERVER_NAME}" '
      { print }
      $0 ~ "server_name" && $0 ~ sn && !done { print inc; done=1 }
    ' "$SITE_CONF" > "${SITE_CONF}.tmp" && mv "${SITE_CONF}.tmp" "$SITE_CONF"
    echo "  inserted: include ${NGINX_SNIPPET};"
  fi
  log "Validating + reloading nginx"
  nginx -t
  systemctl reload nginx
fi

# -----------------------------------------------------------------------------
# 4. Ingest the 5 demo studies (MIMPS-06). Uses a throwaway venv for pydicom/Pillow.
# -----------------------------------------------------------------------------
log "Ingesting 5 de-identified demo chest X-rays"
VENV="${REPO_DIR}/.venv-ingest"
if [ ! -x "${VENV}/bin/python" ]; then
  python3 -m venv "$VENV"
fi
"${VENV}/bin/pip" install -q --disable-pip-version-check "pydicom>=2.4" "pillow>=10.0"
"${VENV}/bin/python" scripts/ingest_demo_studies.py \
  --orthanc-url "$ORTHANC_LOOPBACK" \
  --user "$ORTHANC_USERNAME" \
  --password "$ORTHANC_PASSWORD"

# -----------------------------------------------------------------------------
# 5. Verification.
# -----------------------------------------------------------------------------
log "Verifying Orthanc directly (loopback, with Basic auth)"
curl -fsS -u "${ORTHANC_USERNAME}:${ORTHANC_PASSWORD}" "${ORTHANC_LOOPBACK}/system" \
  | grep -q '"Name"' && echo "  /system OK"
N_STUDIES="$(curl -fsS -u "${ORTHANC_USERNAME}:${ORTHANC_PASSWORD}" "${ORTHANC_LOOPBACK}/studies" \
  | grep -o '"' | wc -l)"; N_STUDIES=$(( N_STUDIES / 2 ))
echo "  Orthanc reports ${N_STUDIES} studies (expected 5)"

log "Verifying QIDO through the on-box gateway (no Orthanc creds — injected server-side)"
# The gateway adds the Authorization header; this request carries NO credentials.
curl -fsS "http://${GATEWAY_UPSTREAM}/pacs/dicom-web/studies" \
  -H 'Accept: application/dicom+json' \
  | grep -o '0020000D' | wc -l | xargs -I{} echo "  gateway QIDO returned {} StudyInstanceUID entries (expected 5)"

log "Done. Public check from your laptop (expects 5 studies, behind the viewer auth gate):"
echo "    curl -u <viewer-demo-user>:<pw> https://${VIEWER_SERVER_NAME}/pacs/dicom-web/studies -H 'Accept: application/dicom+json'"

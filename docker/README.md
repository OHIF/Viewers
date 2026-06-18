# MIMPS DICOM backend (docker/)

Orthanc + a thin nginx gateway that fronts it, plus an optional full-stack
profile (viewer + audit-service) for local dev and on-prem pilots. All brought
up by the root `docker-compose.yml`. See `../.env.example` for the variables.

## Components

### Default service set (always started — what the VPS runs)

| Service          | Container             | Bind            | Role |
|------------------|-----------------------|-----------------|------|
| `orthanc`        | `mimps-orthanc`       | `127.0.0.1:8042` (REST/DICOMweb), `127.0.0.1:4242` (DICOM) | DICOM store + DICOMweb (QIDO/WADO/STOW under `/dicom-web`). Auth always on. |
| `orthanc-nginx`  | `mimps-orthanc-nginx` | `127.0.0.1:8899` | Gateway: adds CORS for the viewer origin and injects Orthanc HTTP Basic creds server-side so the browser never holds them. Exposes `/pacs/...` → Orthanc `/...`. |

### Profile `full` (MIMPS-13 — opt-in via `--profile full`)

| Service         | Container             | Bind             | Role |
|-----------------|-----------------------|------------------|------|
| `audit-service` | `mimps-audit-service` | `127.0.0.1:8081` | FastAPI JWT verifier (INT-05). nginx `auth_request` target; validates RS256 JWTs against the platform JWKS (`BLACKVOXEL_JWKS_URL`). |
| `viewer`        | `mimps-viewer`        | `127.0.0.1:8088` | nginx + built viewer dist (`Dockerfile.viewer`). Serves the SPA shell publicly; `/pacs/` is JWT-gated via `auth_request` → `audit-service`, then proxied (prefix preserved) to the `orthanc-nginx` gateway. |

All ports are **loopback-only**. Public access is only via the host nginx on
`viewer.blackvoxel.ai`, which proxies `/pacs/` → `127.0.0.1:8899` behind the JWT
auth gate. See `scripts/vps-orthanc-runbook.sh`.

## Files

- `orthanc.json` — non-secret Orthanc config. CORS is intentionally **not** here
  (Orthanc has no native CORS); the gateway handles it. Never put credentials here.
- `orthanc-nginx.conf.template` — gateway config; `${ORTHANC_AUTH_B64}` and
  `${MIMPS_VIEWER_ORIGIN}` are substituted at container start.
- `orthanc-nginx-entrypoint.sh` — renders the template (computes the Basic header
  from `ORTHANC_USERNAME`/`ORTHANC_PASSWORD`).
- `nginx.conf` — the viewer edge nginx config (JWT `auth_request` gate) for the
  **host** nginx, used by the VPS deploy; not part of the compose stack.
- `nginx.container.conf` — containerized variant of `nginx.conf`, baked into
  the `viewer` image by `../Dockerfile.viewer`. Upstreams are compose service
  names (`audit-service`, `orthanc-nginx`); `/pacs/` keeps its prefix so the
  gateway can strip it and inject the Orthanc credentials.

## Local dev — backend only (default)

```bash
cp .env.example .env          # set ORTHANC_PASSWORD
docker compose up -d
curl -u mimps:$ORTHANC_PASSWORD http://127.0.0.1:8042/system          # Orthanc direct
curl http://127.0.0.1:8899/pacs/dicom-web/studies \
  -H 'Accept: application/dicom+json'                                  # via gateway (no creds needed)
python3 scripts/ingest_demo_studies.py --password $ORTHANC_PASSWORD    # load 5 demo studies
```

## Local dev — full stack (one command)

```bash
cp .env.example .env          # set ORTHANC_PASSWORD
docker compose --profile full up -d --build
```

Brings up all four services: viewer on `http://localhost:8088`, audit-service on
`http://localhost:8081`, plus the Orthanc backend above. Verify the JWT gate:

```bash
curl -i http://localhost:8088/                              # 200 — SPA shell is public
curl -i http://localhost:8088/pacs/dicom-web/studies        # 401 — no JWT
curl -i -H "Authorization: Bearer $JWT" \
  http://localhost:8088/pacs/dicom-web/studies              # 200 with a platform JWT
```

Notes:
- The viewer image build is **heavy** (webpack production build): give the
  Docker VM at least 8 GB of RAM, expect several minutes. Build it only on a
  workstation/CI — never on the VPS.
- Without a reachable `BLACKVOXEL_JWKS_URL`, every `/pacs/` request 401s (fail
  closed). The default points at the live platform JWKS.
- `docker compose up -d` (no profile) still starts **only** orthanc +
  orthanc-nginx — the runbook contract.

## Path mapping

```
browser/host nginx        gateway (8899)            Orthanc (8042)
/pacs/dicom-web/studies   ->  /dicom-web/studies (QIDO)
/pacs/wado?...            ->  /wado?...          (WADO-URI)
```

The gateway's `proxy_pass http://orthanc:8042/;` (trailing slash) strips the
`/pacs/` prefix. Anything in front of the gateway must **preserve** `/pacs/`
when forwarding (i.e. `proxy_pass` with no path) — true for both the host nginx
on the VPS and the containerized viewer (`nginx.container.conf`).

## Production note (VPS)

The VPS does **not** run the `full` profile. There, only orthanc +
orthanc-nginx run in compose; the viewer is a static dist built on a
workstation and rsynced to the host nginx
(`projects/1_platform/scripts/deploy-viewer-vps.sh` — never build on the box),
and the audit-service runs on the host under systemd (`mimps-audit.service`).
The `full` profile is for local dev and future on-prem/hospital-pilot
deployments.

## VPS deploy

Clone the repo, copy `.env`, then run `scripts/vps-orthanc-runbook.sh` (idempotent):
brings up compose, wires the host nginx `/pacs/` block, ingests the demo studies,
and verifies. Never build the viewer on the box — ship the dist (see
`projects/1_platform/scripts/deploy-viewer-vps.sh`).

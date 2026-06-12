# MIMPS DICOM backend (docker/)

Orthanc + a thin nginx gateway that fronts it. Brought up by the root
`docker-compose.yml`. See `../.env.example` for the required variables.

## Components

| Service          | Container             | Bind            | Role |
|------------------|-----------------------|-----------------|------|
| `orthanc`        | `mimps-orthanc`       | `127.0.0.1:8042` (REST/DICOMweb), `127.0.0.1:4242` (DICOM) | DICOM store + DICOMweb (QIDO/WADO/STOW under `/dicom-web`). Auth always on. |
| `orthanc-nginx`  | `mimps-orthanc-nginx` | `127.0.0.1:8899` | Gateway: adds CORS for the viewer origin and injects Orthanc HTTP Basic creds server-side so the browser never holds them. Exposes `/pacs/...` → Orthanc `/...`. |

Both ports are **loopback-only**. Public access is only via the host nginx on
`viewer.blackvoxel.ai`, which proxies `/pacs/` → `127.0.0.1:8899` behind the demo
auth gate. See `scripts/vps-orthanc-runbook.sh`.

## Files

- `orthanc.json` — non-secret Orthanc config. CORS is intentionally **not** here
  (Orthanc has no native CORS); the gateway handles it. Never put credentials here.
- `orthanc-nginx.conf.template` — gateway config; `${ORTHANC_AUTH_B64}` and
  `${MIMPS_VIEWER_ORIGIN}` are substituted at container start.
- `orthanc-nginx-entrypoint.sh` — renders the template (computes the Basic header
  from `ORTHANC_USERNAME`/`ORTHANC_PASSWORD`).
- `nginx.conf` / `nginx.htpasswd.conf` — viewer edge nginx variants (JWT vs htpasswd
  fallback), used by the broader deploy; not part of the Orthanc gateway.

## Local dev

```bash
cp .env.example .env          # set ORTHANC_PASSWORD
docker compose up -d
curl -u mimps:$ORTHANC_PASSWORD http://127.0.0.1:8042/system          # Orthanc direct
curl http://127.0.0.1:8899/pacs/dicom-web/studies \
  -H 'Accept: application/dicom+json'                                  # via gateway (no creds needed)
python3 scripts/ingest_demo_studies.py --password $ORTHANC_PASSWORD    # load 5 demo studies
```

## Path mapping

```
browser/host nginx        gateway (8899)            Orthanc (8042)
/pacs/dicom-web/studies   ->  /dicom-web/studies (QIDO)
/pacs/wado?...            ->  /wado?...          (WADO-URI)
```

The gateway's `proxy_pass http://orthanc:8042/;` (trailing slash) strips the
`/pacs/` prefix. The host nginx must **preserve** `/pacs/` when forwarding to the
gateway (i.e. `proxy_pass http://127.0.0.1:8899;` with no path).

## VPS deploy

Clone the repo, copy `.env`, then run `scripts/vps-orthanc-runbook.sh` (idempotent):
brings up compose, wires the host nginx `/pacs/` block, ingests the demo studies,
and verifies. Never build the viewer on the box — ship the dist (see
`projects/1_bourdeaux/scripts/deploy-viewer-vps.sh`).

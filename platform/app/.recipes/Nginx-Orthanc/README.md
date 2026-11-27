# Nginx + Orthanc

The OHIF viewer served by nginx, which also proxies `/pacs/` to an Orthanc
PACS. See [Nginx + Image Archive](../../../docs/docs/deployment/nginx--image-archive.md)
for the full guide to this recipe.

## Run

From this directory:

```bash
docker compose up --build
```

`--build` rebuilds the viewer image (`ohif-nginx-orthanc:local`) from this
checkout. Without it, `docker compose up` starts the image from the last
build, even if the code has changed since. From the repository root,
`pnpm run orthanc:up` runs the same command.

## Routes

- `http://localhost/` -> OHIF
- `http://localhost/pacs/` -> Orthanc (its web UI, and DICOMweb at
  `/pacs/dicom-web/`)

If `http://localhost/` jumps somewhere else instead of showing the viewer -
for example to `/app/explorer.html`, a `/dcm4chee-arc/` path, `/ohif-viewer/`
or `https://localhost/` - your browser is replaying a permanent (301) redirect
it cached from something that served port 80 before, such as a standalone
PACS or one of the Keycloak recipes. Open a private window, or clear the site
data for `localhost` in your browser.

## Security notes

- CORS: earlier versions of this recipe set `Access-Control-Allow-Origin: *`
  on the `/pacs/` proxy. That default has been removed. The viewer is served
  by the same nginx as the proxy, so same-origin deployments need no CORS
  headers. If you host the viewer on a different origin, set that origin
  explicitly in `config/nginx.conf` - never `*` on an endpoint that serves
  PHI.

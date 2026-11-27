# Nginx + dcm4chee

The OHIF viewer served by nginx, which also proxies the dcm4chee archive and
its admin UI. See [OHIF + Dcm4chee](../../../docs/docs/deployment/nginx--image-archive.md#ohif--dcm4chee)
for the guide to this recipe.

## Run

From this directory:

```bash
docker compose up --build
```

`--build` rebuilds the viewer image (`ohif-nginx-dcm4chee:local`) from this
checkout. Without it, `docker compose up` starts the image from the last
build, even if the code has changed since.

The archive keeps its data under `~/dcm4chee-arc/` on the host, so studies
survive `docker compose down`.

## Routes

- `http://localhost/` -> OHIF
- `http://localhost/pacs` -> the dcm4chee admin UI, for uploading studies
- `http://localhost/dcm4chee-arc/` -> the dcm4chee archive. The viewer reads
  DICOMweb from `/dcm4chee-arc/aets/DCM4CHEE/rs`.

If `http://localhost/` jumps somewhere else instead of showing the viewer -
for example to `/app/explorer.html`, a `/dcm4chee-arc/` path, `/ohif-viewer/`
or `https://localhost/` - your browser is replaying a permanent (301) redirect
it cached from something that served port 80 before, such as a standalone
PACS or one of the Keycloak recipes. Open a private window, or clear the site
data for `localhost` in your browser.

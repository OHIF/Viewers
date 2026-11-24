# Nginx + Orthanc + Keycloak

The OHIF viewer served by nginx, with sign-in through oauth2-proxy and
Keycloak, and an Orthanc PACS behind the same sign-in. See
[User Account Control](../../../docs/docs/deployment/user-account-control.md)
for the full guide to this recipe, including running it on a server with TLS.

## Before you start

Before the first `docker compose up`:

1. Set the secrets listed in [SECURITY-NOTES.md](SECURITY-NOTES.md): the
   `.env` passwords, the client secret and the cookie secret.
2. Replace `YOUR_DOMAIN` in `docker-compose.yml`, `config/nginx.conf` and
   `config/oauth2-proxy.cfg`, and provide the TLS certificate that
   `config/nginx.conf` points at. nginx does not start without it. The guide
   walks through both.

## Run

From this directory:

```bash
docker compose up --build
```

`--build` rebuilds the viewer image (`ohif-nginx-orthanc-keycloak:local`)
from this checkout. Without it, `docker compose up` starts the image from the
last build, even if the code has changed since.

## After the first start

Change the passwords of the default `viewer` and `pacsadmin` users, or delete
those users. See "Default users" in [SECURITY-NOTES.md](SECURITY-NOTES.md).

## Routes

- `http://YOUR_DOMAIN/...` -> redirects (301) to `https://YOUR_DOMAIN/...`
- `https://YOUR_DOMAIN/` -> redirects (301) to `/ohif-viewer/`
- `/ohif-viewer/` -> OHIF, after signing in with Keycloak
- `/pacs/` -> Orthanc DICOMweb, for signed-in users
- `/pacs-admin/` -> the Orthanc web UI, for uploading studies
- `/keycloak/` -> Keycloak, including its admin console

The two redirects above are intended. Your browser caches them, though, so a
recipe you run on the same host afterwards may still jump to `https://` or
`/ohif-viewer/`. If the site jumps somewhere this list doesn't explain - or
another recipe does after this one - your browser is replaying a permanent
(301) redirect it cached earlier. Open a private window, or clear the site
data for the host in your browser.

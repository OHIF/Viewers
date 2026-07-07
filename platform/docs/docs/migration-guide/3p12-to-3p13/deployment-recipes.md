---
sidebar_position: 9
sidebar_label: Deployment recipes
title: Deployment recipes migration
---

# Deployment recipes migration

The deployment recipes under `platform/app/.recipes` no longer ship working
credential values or permissive CORS defaults. If you deploy from these
recipes, or you templated your own deployment from an earlier checkout, a few
one-time steps are now required. The viewer application itself is unaffected.

## Keycloak recipes require a .env file

Applies to `Nginx-Orthanc-Keycloak` and `Nginx-Dcm4chee-Keycloak`.

The docker-compose files previously hardcoded the Keycloak admin and
PostgreSQL passwords. They now read them from the environment and refuse to
start while any is unset:

```text
error while interpolating services.keycloak.environment.POSTGRES_PASSWORD:
required variable POSTGRES_PASSWORD is missing a value: set POSTGRES_PASSWORD in your .env
```

**Migration:** copy `.env.example` to `.env` next to `docker-compose.yml` and
set strong values:

```bash
cp .env.example .env
# then edit .env and fill in:
# POSTGRES_PASSWORD=
# KEYCLOAK_ADMIN_PASSWORD=
```

`POSTGRES_PASSWORD` is the single PostgreSQL credential - Keycloak connects to
Postgres as the `keycloak` role provisioned with it, so `KC_DB_PASSWORD` is
derived from `POSTGRES_PASSWORD` in the compose file rather than set
separately.

## Keycloak client secret is now a placeholder

The realm import (`config/ohif-keycloak-realm.json`) and the oauth2-proxy
config (`config/oauth2-proxy.cfg`) previously shipped a fixed value for the
`ohif_viewer` client secret. Both files now contain the placeholder
`REPLACE_WITH_A_GENERATED_CLIENT_SECRET`.

**Migration:** generate a fresh value and put the same value in both files
before `docker compose up`. To generate one after the realm is imported:
Keycloak admin console -> Clients -> `ohif_viewer` -> Credentials ->
Regenerate.

**If you deployed from an earlier checkout:** the old fixed value is public in
the repository history, so regenerating it is required for existing
deployments too, not just new ones. Regenerate it in the Keycloak admin
console and update `config/oauth2-proxy.cfg` to match. Rotating the Keycloak
admin and PostgreSQL passwords is likewise recommended. See the
`SECURITY-NOTES.md` file inside each Keycloak recipe directory for the full
checklist.

## nginx recipes no longer send wildcard CORS headers

Applies to `Nginx-Orthanc`, `Nginx-Orthanc-Keycloak`, and
`Nginx-Dcm4chee-Keycloak`.

The nginx configs previously answered PACS/DICOMweb proxy requests with
`Access-Control-Allow-Origin: *`. Those headers were removed.

- **Same-origin deployments (the recipe default):** no action needed. The
  viewer is served by the same nginx as the proxy, so these requests never
  needed CORS headers.
- **Cross-origin deployments** (viewer hosted on a different origin than the
  proxy): browser requests to the proxy will now fail CORS checks until you
  re-add the headers with your viewer's origin spelled out explicitly. Each
  config contains a commented example next to the old location:

```nginx
# add_header 'Access-Control-Allow-Origin' 'https://viewer.example.com' always;
```

Use your actual viewer origin; avoid `'*'` on endpoints that serve patient
data.

## Logout redirect_uri is validated

`/logout?redirect_uri=...` now only honors same-origin (or relative) values.
Anything else falls back to the configured `post_logout_redirect_uri` from
your OIDC configuration. The viewer's own logout flows always pass same-origin
values, so in-app behavior is unchanged.

**Migration:** only needed if you linked to `/logout` with a `redirect_uri`
pointing at a different origin (for example, an external portal). Configure
that destination as the client's `post_logout_redirect_uri` in your OIDC
configuration instead of passing it in the query string.

## New Content-Security-Policy-Report-Only header (no action needed)

Hosted deployments configured via `netlify.toml` now send a
`Content-Security-Policy-Report-Only` header. It is observational only:
browsers log would-be violations to the devtools console and block nothing.
The nginx recipes carry the same policy as commented examples. See the
[Deploy Static Assets](../../deployment/static-assets.md#content-security-policy)
docs for what the policy covers and how to read the console reports.

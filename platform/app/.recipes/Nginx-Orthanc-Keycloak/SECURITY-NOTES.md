# Security notes for this recipe

## Secrets

This recipe no longer ships working credential values. Before `docker compose up`:

- Generate a fresh OAuth client secret for the `ohif_viewer` client and use it
  to replace the `REPLACE_WITH_A_GENERATED_CLIENT_SECRET` placeholder in BOTH
  `config/ohif-keycloak-realm.json` and `config/oauth2-proxy.cfg` (the two
  values must match). To generate one after the realm is imported: Keycloak
  admin console -> Clients -> ohif_viewer -> Credentials -> Regenerate.
- Copy `.env.example` to `.env` and set `POSTGRES_PASSWORD` and
  `KEYCLOAK_ADMIN_PASSWORD` to strong values. `docker compose` refuses to
  start while either is unset. `POSTGRES_PASSWORD` is the single PostgreSQL
  credential - it both provisions the `keycloak` database role and is what
  Keycloak uses to connect (the compose file derives `KC_DB_PASSWORD` from it),
  so there is one database password to set, not two.

## Rotate if you deployed from an earlier checkout

Earlier versions of this recipe committed a fixed client secret and default
admin/database passwords to the public repository. A committed secret stays
burned even after this change, so any deployment created from an earlier
checkout must rotate:

- the `ohif_viewer` client secret (Keycloak admin console -> Clients ->
  ohif_viewer -> Credentials -> Regenerate, then update
  `config/oauth2-proxy.cfg` to match), and
- the Keycloak admin and PostgreSQL passwords. Note that changing
  `POSTGRES_PASSWORD` in `.env` alone does not re-password an existing
  database: Postgres only applies it when the `postgres_data` volume is first
  initialized. To actually rotate it on an existing deployment, either
  `ALTER ROLE keycloak WITH PASSWORD ...` inside the running database or
  recreate the `postgres_data` volume.

## CORS

The wildcard `Access-Control-Allow-Origin: *` defaults were removed from
`config/nginx.conf`. The viewer is served by the same nginx as the DICOMweb
proxy, so same-origin deployments need no CORS headers. If you host the viewer
on a different origin, use the commented explicit-origin example in the nginx
config - never `*` on an authenticated endpoint that serves PHI.

# Security notes for this recipe

## Secrets

This recipe no longer ships working credential values. Before `docker compose up`:

- Generate a fresh OAuth client secret for the `ohif_viewer` client and use it
  to replace the `REPLACE_WITH_A_GENERATED_CLIENT_SECRET` placeholder in BOTH
  `config/ohif-keycloak-realm.json` and `config/oauth2-proxy.cfg` (the two
  values must match). To generate one after the realm is imported: Keycloak
  admin console -> Clients -> ohif_viewer -> Credentials -> Regenerate.
- Copy `.env.example` to `.env` and set `KC_DB_PASSWORD`,
  `KEYCLOAK_ADMIN_PASSWORD`, and `POSTGRES_PASSWORD` to strong, unique values.
  `docker compose` refuses to start while any of them is unset.

## Rotate if you deployed from an earlier checkout

Earlier versions of this recipe committed a fixed client secret and default
admin/database passwords to the public repository. A committed secret stays
burned even after this change, so any deployment created from an earlier
checkout must rotate:

- the `ohif_viewer` client secret (Keycloak admin console -> Clients ->
  ohif_viewer -> Credentials -> Regenerate, then update
  `config/oauth2-proxy.cfg` to match), and
- the Keycloak admin and PostgreSQL passwords.

## CORS

The wildcard `Access-Control-Allow-Origin: *` defaults were removed from
`config/nginx.conf`. The viewer is served by the same nginx as the dcm4chee
proxy, so same-origin deployments need no CORS headers. If you host the viewer
on a different origin, use the commented explicit-origin example in the nginx
config - never `*` on an authenticated endpoint that serves PHI.

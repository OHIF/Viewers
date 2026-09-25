---
sidebar_position: 13
title: Runtime Plugins & CSP
summary: Deployment convention for serving runtime extension/mode bundles from a /plugins/ directory behind the official Docker/nginx image, the docker-compose mount, the optional CSP_HEADER baseline, and a smoke checklist.
---

# Runtime Plugins & CSP

Runtime plugins let you deploy prebuilt extension and mode bundles alongside the
viewer and load them at runtime through descriptor entries in `app-config.js` —
no viewer rebuild. This page covers how the official Docker/nginx image serves
those bundles, how to mount them, and the optional Content-Security-Policy
header.

For the descriptor object itself (field-by-field reference, the
`runtimeExtensionOrigins` allowlist, and the `window.__ohif.runtimeExtensions`
audit surface) the normative reference is
[Runtime Extensions and Modes (Track B)](../configuration/configurationFiles.md#runtime-extensions-and-modes-track-b)
in the Configuration Files guide. See also the
[Runtime Extensions](../platform/extensions/runtime-extensions.md) overview. This
page does not restate the descriptor contract; it only documents deployment.

:::note Requires a 3.14 or later image
The `/plugins/` location, its cache rules, and `CSP_HEADER` exist only in
images built from OHIF 3.14 or later. An older `ohif/app` image (including a
`latest` tag that still points at a 3.13 release) has no runtime loader and
ignores `extensions`/`modes` descriptors entirely. Pin a 3.14+ tag.
:::

## The /plugins/ directory convention

The image serves runtime plugins from a dedicated `/plugins/` location. The
layout is:

```
plugins/<packageName>/<version>/<files>
```

- `<packageName>` may be scoped, e.g. `@acme/ohif-extension-xyz`, in which case
  the path is `plugins/@acme/ohif-extension-xyz/1.2.3/index.umd.js`.
- `<version>` is a semver directory. **Versioned directories are what earns
  `Cache-Control: public, max-age=31536000, immutable`** — the bytes at a
  versioned URL are assumed never to change, so browsers may cache them
  indefinitely.
- **Unversioned paths** (anything under `/plugins/` that does not sit inside a
  `X.Y.Z` directory) are served `Cache-Control: no-cache`, so the browser
  revalidates on every load and a swap is picked up on a normal reload.

These headers come from the nginx config in the official `ohif/app` image
(`.docker/Viewer-v3.x/default.conf.template`). The caching itself happens in
each user's browser, which is why restarting the container changes nothing. A
deployment that serves `/plugins/` through another server or CDN must set
equivalent `Cache-Control` rules itself.

Missing files under `/plugins/` return `404` — they never fall back to
`index.html` the way the SPA route does, so the loader can distinguish a real
bundle from an HTML error page.

When `PUBLIC_URL` is not `/`, the location is prefixed accordingly (for a build
with `PUBLIC_URL=/ohif/`, plugins are served under `/ohif/plugins/`).

## Referencing a plugin from app-config

Point an `extensions` (or `modes`) entry at the served URL. The descriptor
shape is:

```js
extensions: [{
  packageName: '@acme/ohif-extension-xyz',
  importPath: '/plugins/@acme/ohif-extension-xyz/1.2.3/index.umd.js',
  globalName: '@acme/ohif-extension-xyz',
  coreVersionRange: '^3.13.0',
  styles: ['/plugins/@acme/ohif-extension-xyz/1.2.3/styles.css'],
}],
```

`globalName` is required for UMD bundles, which is what `pnpm create ohif`
produces today: after the script runs, the loader reads the plugin from
`window[globalName]`, and `globalName` is the package name (the bundle's library
name). Without it the loader treats the file as an ES module, finds no default
export, and fails with `import-error`. ES module bundles omit `globalName`.

`importPath` must be `PUBLIC_URL`-prefixed when `PUBLIC_URL` is not `/` (e.g.
`/ohif/plugins/@acme/ohif-extension-xyz/1.2.3/index.umd.js`). Same-origin
`/plugins/` URLs need no `integrity` and no entry in `runtimeExtensionOrigins`;
cross-origin bundles require both — see the
[descriptor fields](../configuration/configurationFiles.md#descriptor-fields)
reference. That `integrity` requirement applies to descriptors specifically;
build-time `pluginConfig.json` `importPath` entries and the `peerImport` URL
fallthrough are treated differently, per
[Where integrity is enforced](../configuration/configurationFiles.md#where-integrity-is-enforced).

## docker-compose example

Mount the host `plugins/` tree read-only into the image's plugins root and
optionally set the CSP header:

```yaml
services:
  viewer:
    image: ohif/app:latest
    ports:
      - '3000:80'
    environment:
      # Optional. Omit the variable entirely to send no CSP header. This is the
      # baseline plus the additions every deployment needs (see "Extending the
      # baseline"); replace pacs.example.com with your DICOMweb origin.
      CSP_HEADER: "default-src 'self'; script-src 'self' 'wasm-unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https://pacs.example.com; connect-src 'self' https://pacs.example.com; worker-src 'self' blob:; object-src 'none'; base-uri 'self'"
    volumes:
      # /plugins/<packageName>/<version>/... (read-only)
      - ./plugins:/usr/share/nginx/html/plugins:ro
```

## Content-Security-Policy (CSP_HEADER)

`CSP_HEADER` is **unset by default**: with no value, the image sends no
`Content-Security-Policy` response header at all, preserving the current
behavior. Set it to opt into a CSP.

### The baseline

The baseline is OHIF's own reference minimum, not an external standard. It is
the strictest policy the viewer's code could run under if it had no inline
scripts, no inline styles, and a same-origin PACS. It has all three, so no
deployment runs it unchanged: every real `CSP_HEADER` is this string plus the
additions in the next two sections. It is written down so the additions have a
fixed starting point:

```
default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; worker-src 'self' blob:; object-src 'none'; base-uri 'self'
```

Value constraints (the string is spliced into an nginx double-quoted string):

- Single line.
- Must not contain double quotes, backslashes, or `$` (in an nginx string, `$`
  starts a variable).

:::caution The bare baseline does not boot the viewer
Set exactly the value above and the viewer's own inline bootstrap scripts, its
inline styles, and every request to a cross-origin PACS are blocked. A policy
that works for a typical deployment is the baseline plus the additions listed
below, with `pacs.example.com` replaced by your DICOMweb origin:

```
default-src 'self'; script-src 'self' 'wasm-unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https://pacs.example.com; connect-src 'self' https://pacs.example.com; worker-src 'self' blob:; object-src 'none'; base-uri 'self'
```
:::

### Extending the baseline

The bare baseline is deliberately minimal and does **not** work for most
deployments as-is. Extend it for your environment:

- **`connect-src` is almost always required.** The shipped default config points
  at a cross-origin CloudFront DICOMweb PACS, and `default-src 'self'` acts as
  the `connect-src` fallback, so the bare baseline blocks study loading. Add
  every cross-origin DICOMweb origin your data sources use to `connect-src`.
- **`style-src 'self' 'unsafe-inline'` is always required.** React, the toast
  layer, and the viewport grid set inline styles at runtime; with no
  `style-src`, `default-src 'self'` applies and blocks them, and the viewer
  renders broken. This is the standard trade-off for React applications: script
  injection stays locked down while inline styles are permitted.
- **`img-src 'self' data: blob: <your PACS origin>`** is commonly needed:
  data/blob image URLs, plus thumbnails fetched from a cross-origin DICOMweb
  server.
- **Cross-origin plugin origins.** Any origin listed in
  `window.config.runtimeExtensionOrigins` must also be added to `script-src`,
  and each such descriptor requires `integrity` per the descriptor contract.
- **`script-src blob:` for cross-origin integrity loads.** A cross-origin
  integrity-pinned plugin is loaded by fetching the bundle, verifying its
  digest, and importing it through a `blob:` URL. That import needs
  `script-src blob:`, which the baseline omits; add it whenever you load
  cross-origin plugins. The plugin's origin must also send CORS headers (the
  integrity fetch uses `mode: 'cors'`). Same-origin `/plugins/` bundles need
  neither `blob:` nor CORS.
- **Legacy workbox CDN imports.** If the service worker is ever re-enabled, it
  imports workbox from `storage.googleapis.com`
  (`service-worker.js`, `init-service-worker.js`), which the baseline
  `script-src 'self'` blocks; that origin would then need a `script-src`
  addition. The service worker is not registered today (see below), so this
  does not apply to current deployments.

### Interim note: inline bootstrap scripts

As written, the baseline's `script-src 'self' 'wasm-unsafe-eval'` also blocks
the viewer's own two inline bootstrap scripts in `index.html` (the
`window.PUBLIC_URL` bootstrap and `browserImportFunction`), so the app itself
cannot boot under the enforced baseline. Until the automated inline-script-hash
handshake ships, a deployment that enables `CSP_HEADER` must **interim-add
`'unsafe-inline'` to `script-src`**:

```
script-src 'self' 'wasm-unsafe-eval' 'unsafe-inline'
```

Alternatively, add the per-deployment `sha256-...` hashes of those two inline
scripts to `script-src`. The hashes are build-deterministic but vary with
`PUBLIC_URL` (which is interpolated into both scripts), so they must be computed
per deployment. This same caveat is documented in the
[CSP and CORS requirements](../configuration/configurationFiles.md#csp-and-cors-requirements)
reference.

## Service worker and caching

- The precache manifest **excludes** `plugins/`, so a plugin baked into the
  image is never pinned to the app build hash.
- Runtime `/plugins/` fetches use a **NetworkOnly** route, so a service worker
  cache never serves a stale plugin bundle.
- The service worker is **not registered** in the shipped viewer today
  (registration is dead code in `init-service-worker.js`), so the operative
  caching mechanism is browser HTTP caching — the `no-cache` (unversioned) vs.
  `immutable` (versioned) split described above. The service-worker measures are
  defense-in-depth for any future re-enablement.

## Smoke checklist

Run from the repo root. Commands are PowerShell; use `curl.exe` (not the
PowerShell `curl` alias).

1. Build: `docker build -t ohif/viewer:ws8 .`
2. Fixture: a versioned bundle `@ohif-test/smoke/1.0.0/{index.umd.js,index.mjs}`
   plus an unversioned `ping.js`, under a host `plugins-fixture/` tree.
3. CSP on:
   ```powershell
   $env:CSP_HEADER = "default-src 'self'; script-src 'self' 'wasm-unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https://d14fa38qiwhyfd.cloudfront.net; connect-src 'self' https://d14fa38qiwhyfd.cloudfront.net; worker-src 'self' blob:; object-src 'none'; base-uri 'self'"
   docker run -d --rm --name ohif-ws8 -p 3300:80 -e CSP_HEADER -v "${PWD}\plugins-fixture:/usr/share/nginx/html/plugins:ro" ohif/viewer:ws8
   ```
   (The policy is the working form from the caution above, with the CloudFront
   demo PACS from the image's default config as the `connect-src`/`img-src`
   origin. `-e CSP_HEADER` with no value passes the variable through unchanged;
   PowerShell 5.1 re-quotes inline values and breaks on the embedded quotes.)
   - `curl.exe -sI http://localhost:3300/ | findstr /i content-security-policy` -> the exact policy string.
   - `curl.exe -sI http://localhost:3300/plugins/@ohif-test/smoke/1.0.0/index.umd.js` -> 200 + `text/javascript` + immutable + CSP header.
   - `curl.exe -sI http://localhost:3300/plugins/ping.js` -> `Cache-Control: no-cache`.
   - `curl.exe -sI http://localhost:3300/plugins/@ohif-test/missing/9.9.9/x.js` -> 404.
4. CSP off (default): rerun without `-e CSP_HEADER`;
   `curl.exe -sI http://localhost:3300/ | findstr /i content-security-policy; $LASTEXITCODE`
   -> no output, exit 1.
5. Runtime extension under CSP: set the `APP_CONFIG` env to a config whose
   `extensions:[{ packageName, globalName, importPath: '/plugins/...' }]` points
   at a real UMD build in the fixture (`$env:APP_CONFIG = Get-Content -Raw
   -Encoding UTF8 .\app-config.js`, then `-e APP_CONFIG` with no value); open `http://localhost:3300` in a browser; assert
   DevTools console shows zero CSP violation reports for the plugin script, and
   `window.__ohif.runtimeExtensions` contains a success record for the
   `packageName`.
6. No stale plugin bytes after a swap:
   - Assert no service worker controls the page today: DevTools console
     `navigator.serviceWorker.controller` -> `null`, so the only caching layer
     is HTTP.
   - Unversioned swap: overwrite `plugins-fixture\ping.js` with new content,
     then a normal (non-hard) reload of `/plugins/ping.js` returns the new bytes
     — `no-cache` forces revalidation.
   - Versioned discipline: publish the changed plugin as `.../1.0.1/` and update
     the descriptor `importPath`; the old `1.0.0` URL may stay cached forever
     (immutable) by design.
7. Teardown: `docker stop ohif-ws8` and delete the fixture.

## Troubleshooting

- **Got HTML instead of JS.** The `/plugins/` location is missing (the request
  fell into the SPA route and returned `index.html` with a 200), or the file
  path is wrong. Confirm the `/plugins/` location exists in the running nginx
  config and that the requested file is actually present; a genuine miss should
  return 404, not HTML.
- **`import-error: module evaluated but has no default export`.** The
  descriptor has no `globalName`, so the loader treated a UMD bundle as an ES
  module. Add `globalName` (the package name) to the descriptor.
- **Wrong MIME on `.mjs`.** nginx's stock `mime.types` does not map `.mjs`; the
  `/plugins/` location declares `text/javascript` for `js`/`mjs` explicitly.
  If an `.mjs` bundle is served with the wrong type, the request is not being
  handled by the `/plugins/` location.
- **CSP violation in the console.** Read the violated directive: a blocked
  `connect-src` means your DICOMweb origin is missing from the header; a blocked
  `script-src` for a cross-origin plugin means the origin (and possibly `blob:`)
  is missing; a blocked inline script at boot means the interim `'unsafe-inline'`
  note above has not been applied. See
  [Extending the baseline](#extending-the-baseline).
- **Stale plugin after an update.** Check the `Cache-Control` on the plugin URL.
  A versioned URL is `immutable` and will be cached indefinitely — bump the
  version directory and update the descriptor `importPath` instead of
  overwriting bytes at the same versioned URL. Unversioned URLs are `no-cache`
  and revalidate; if they still serve stale bytes, confirm the file is served by
  the `/plugins/` location and not an intermediary cache/CDN.

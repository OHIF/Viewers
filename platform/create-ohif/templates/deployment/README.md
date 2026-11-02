# {{name}}

Configuration-only OHIF Viewer deployment: the stock `ohif/app` Docker image
plus your own `app-config.js`. There is nothing to build here.

## Files

- `app-config.js` -- the viewer configuration (data sources, runtime plugin
  descriptors, feature flags).
- `docker-compose.yml` -- runs `ohif/app` and injects `app-config.js` through
  the image's `APP_CONFIG` entrypoint.

## Run

```sh
APP_CONFIG="$(cat app-config.js)" docker compose up
```

The viewer is served at http://localhost:3000. Edit `app-config.js` and
re-run the command to apply changes.

To pin the viewer version, replace the `ohif/app:latest` tag in
`docker-compose.yml` with a specific release tag. Runtime-loaded plugins (below)
need an image built from OHIF 3.14 or later; if `latest` still points at an
older release, pin a 3.14+ tag.

## Runtime-loaded plugins (optional)

Prebuilt plugin bundles can be served next to the viewer and loaded at
runtime without rebuilding the image:

1. Create a `plugins/` folder here and copy each plugin's built output into
   `plugins/<plugin-name>/<version>/` (the `dist/` contents: `index.umd.js`
   and, for extensions with styles, `index.css`). The version directory is
   what the nginx config in the `ohif/app` image keys its cache rules off:
   versioned paths are sent with `Cache-Control: immutable`, so browsers keep
   them for a year without re-checking, and unversioned paths are sent
   `no-cache`. Ship a changed plugin under a new version directory rather than
   overwriting files in place. If you serve `/plugins/` from something other
   than that image, reproduce those headers yourself.
2. Uncomment the `/plugins/` volume in `docker-compose.yml`.
3. Declare a descriptor for each plugin in `app-config.js` under
   `extensions` or `modes`:

```js
extensions: [
  {
    packageName: '@my-scope/my-ohif-extension',
    importPath: '/plugins/my-ohif-extension/1.0.0/index.umd.js',
    // Required for UMD bundles (what pnpm create ohif builds): the package name.
    globalName: '@my-scope/my-ohif-extension',
    coreVersionRange: '{{coreRange}}',
    styles: ['/plugins/my-ohif-extension/1.0.0/index.css'],
  },
],
```

If you also author your own extensions or modes, scaffold a workspace
instead: `pnpm create ohif my-workspace -t workspace`.

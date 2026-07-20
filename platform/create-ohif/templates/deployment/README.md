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
`docker-compose.yml` with a specific release tag.

## Runtime-loaded plugins (optional)

Prebuilt plugin bundles can be served next to the viewer and loaded at
runtime without rebuilding the image:

1. Create a `plugins/` folder here and copy each plugin's built output into
   `plugins/<plugin-name>/` (the `dist/` contents: `index.umd.js` and, for
   extensions with styles, `index.css`).
2. Uncomment the `/plugins/` volume in `docker-compose.yml`.
3. Declare a descriptor for each plugin in `app-config.js` under
   `extensions` or `modes`:

```js
extensions: [
  {
    packageName: '@my-scope/my-ohif-extension',
    importPath: '/plugins/my-ohif-extension/index.umd.js',
    globalName: '@my-scope/my-ohif-extension',
    coreVersionRange: '{{coreRange}}',
    styles: ['/plugins/my-ohif-extension/index.css'],
  },
],
```

If you also author your own extensions or modes, scaffold a workspace
instead: `pnpm create ohif my-workspace -t workspace`.

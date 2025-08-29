---
sidebar_position: 4
title: Custom URL Access/Build
summary: "Instructions for hosting the OHIF Viewer on custom URL paths, with two deployment approaches: simple setup for serving the viewer from a subpath with assets at the root, and advanced setup for custom asset paths with detailed configuration steps."
---


# Hosting the Web Viewer on a Custom URL Path

You can host the viewer on a subpath like `/abc` instead of the root `/`. There are **two levels** of customization depending on how you want to serve your static assets.


## Simple Setup (Recommended for Most Use Cases)

If you want to make the viewer accessible from a custom path (e.g. `/abc`) and **don’t care where the assets are loaded from** (they’ll be fetched from the root `/`), this setup is for you.

### What You Get

- Viewer available at `https://yourdomain.com/abc`
- All assets (JS, WASM, etc.) still loaded from the root (`/app.js`, `/viewer.wasm`, etc.)

### How To Set It Up

1. Set `routerBasename` in your config file (e.g., `config/myConfig.js`) to `/abc`
2. Build the viewer with:

```bash
APP_CONFIG=config/myConfig.js yarn build
```

### Local Development

```bash
APP_CONFIG=config/myConfig.js yarn dev
```

---

##  Advanced Setup (Custom Asset Path)

If you want to host the viewer at `/abc` **and** serve static assets from a different location (e.g. `/my-private-assets`), this is a more advanced scenario.

### What You Get

- Viewer accessible from `https://yourdomain.com/abc`
- All assets loaded from `https://yourdomain.com/my-private-assets/`

### Why This is Tricky

Some libraries (especially ones using WASM) load assets using **relative paths**, which can break if not handled carefully. To solve this:

- Set `routerBasename` to `/abc`
- Set `PUBLIC_URL` to `/my-private-assets/`
- Webpack will load assets from the specified public URL.

### Local Development Notes

In development, use proxy rewrites to handle relative asset paths. Example for `dicom-microscopy-viewer`:

```js
proxy: {
  '/dicom-microscopy-viewer': {
    target: 'http://localhost:3000',
    pathRewrite: {
      '^/dicom-microscopy-viewer': `/${PUBLIC_URL}/dicom-microscopy-viewer`,
    },
  },
}
```

This ensures local development can find assets even when libraries expect them at certain paths.


### Building and Serving in Production

To build the viewer for production:

```bash
PUBLIC_URL=/my-private-assets/ APP_CONFIG=config/myConfig.js yarn build
```

If you're using `npx serve`, make sure to update `serve.json`:

```json
{
  "rewrites": [{ "source": "*", "destination": "/abc/index.html" }]
}
```

Serve the viewer like this:

```bash
cd platform/app
mv dist abc  # Rename dist folder to match your viewer route
npx serve -c ./public/serve.json
```

---

### 🐳 Using Docker? You're Covered

If you’re using our Dockerfile, you’re all set — it already handles copying specific asset folders (like `dicom-microscopy-viewer`) to the root:

```Dockerfile
COPY --from=builder /usr/src/app/platform/app/dist/dicom-microscopy-viewer /usr/share/nginx/html/dicom-microscopy-viewer
```

Keep an eye on the browser network tab for any assets that might fail to load — if any other libraries require similar treatment, you’ll need to handle those as well.

---

## Summary

| Goal                              | routerBasename | PUBLIC_URL           | Assets Load From        |
|-----------------------------------|----------------|-----------------------|--------------------------|
| Viewer at `/abc`, assets from `/` | `/abc`         | default                   | Root `/`                 |
| Viewer at `/abc`, assets from `/my-private-assets` | `/abc`         | `/my-private-assets/`  | `/my-private-assets/`    |

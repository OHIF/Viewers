---
sidebar_position: 1
title: General
summary: General migration changes from OHIF 3.9 to 3.10, including Node.js version update, HTML template modifications, bundled Google Fonts, docs updates, faster development builds with rsbuild, and webpack configuration changes for AI segmentation support.
---

## Node.js Version Update

We have updated the recommended Node.js version from `18.16.1` to `20.9.0`. Please ensure your development and build environments are using Node.js `20.9.0` or later.

## HTML Template Update
We have modified the `template.html` file so if you are using a custom template, you will need to update it.

Here are the key changes needed in the migration:

1. Added `window.PUBLIC_URL` declaration:
```javascript
window.PUBLIC_URL = '<%= PUBLIC_URL %>';
```

Was added before the `<!-- EXTENSIONS -->` comment block.

## Bundled Google Fonts

Previously, OHIF relied on the Google Fonts API to load the required fonts. To improve privacy, performance, and offline availability, we now bundle the necessary font files as assets within the application. No explicit action is required for this change unless you were specifically overriding or manipulating the font loading process.

You **might** need to update your `module` rule in your webpack

```javascript
module.exports = {
  module: {
    rules: [
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/i,
        type: 'asset/resource',
      },
    ],
  },
};
```




## OHIF Docs

OHIF platform/docs is no longer part of the workspace.

-  Builds are faster for 99.99% of users since only maintainers need to run the docs development.

If you need to run the docs website locally, you must install it first, as it is not installed by default.

Before:
```bash
yarn run dev
```

After:
```bash
yarn install
yarn run dev
```


## Experimental Fast Development Build (`dev:fast`)

We have introduced a new experimental command, `yarn run dev:fast`, which utilizes `rsbuild` and its Rust-based approach to significantly speed up development server start and hot module replacement times.

Here's a comparison of the performance improvements:

| Scenario | Load Time   | Update Time |
| -------- | ----------- | ----------- |
| Before   | ~12 seconds | ~5 seconds  |
| After    | ~4 seconds  | ~1 second   |

**Note:** This command is currently experimental. While functional, it may not yet support all features or configurations of the standard `yarn run dev` command. We are continuing to develop and test this feature.


## Webpack Configuration

To use our new Segmentation AI models, you'll need `onnxruntime-web`. If you're using a custom webpack configuration, make sure to update it with the new `copyPlugin` to copy the `onnxruntime-web` `dist` folder to your output directory.


```javascript
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
  plugins: [
    new CopyPlugin({
      patterns: [
        {
          from: '../../../node_modules/onnxruntime-web/dist',
          to: `${DIST_DIR}/ort`,
        },
      ],
    }),
  ],
};
```

Also, if you're running the viewer from a sub-route, you'll need to update the `dicom-microscopy-viewer` package in the dev server, so it knows where to load the assets from.


```javascript
devServer: {
  proxy: {
    '/dicom-microscopy-viewer': {
      target: 'http://localhost:3000',
      pathRewrite: {
        '^/dicom-microscopy-viewer': `/${PUBLIC_URL}/dicom-microscopy-viewer`,
      },
    },
  },
},
```

:::note
Also, the `writePluginImportFile` function has been updated so that the dicom-microscopy-viewer package works correctly with the new webpack configuration. If you have a custom `writePluginImportFile` function, please update it to match.
:::

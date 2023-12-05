---
sidebar_position: 4
title: Custom URL Access
---


## Build for non-root path

Sometimes it is desired to access the viewer from a non-root path (e.g., `/my-awesome-viewer` instead of `/`).
You can achieve so by using the `PUBLIC_URL` environment variable AND the `routerBasename` configuration option.

1. use a config (e.g. `config/myConfig.js`) file that is using the `routerBasename` of your choice `/my-awesome-viewer` (note there is only one / - it is not /my-awesome-viewer/).
2. build the viewer with `PUBLIC_URL=/my-awesome-viewer/` (note there are two / - it is not /my-awesome-viewer).


:::tip
The PUBLIC_URL tells the application where to find the static assets and the routerBasename will tell the application how to handle the routes
:::


### Testing in Development
For testing the build locally, you can use the following command:

```bash
# we use default config file, so we assume you have already set the routerBasename to /my-awesome-viewer in the default config as an example
PUBLIC_URL=/my-awesome-viewer/ APP_CONFIG=config/default.js yarn dev
```


### Testing in Build (production)
You need to build the viewer with the following command:

```bash
PUBLIC_URL=/my-awesome-viewer/ APP_CONFIG=config/default.js yarn build
```

We can use the `npx serve` to serve the build folder. There are two things you need to consider however,
1. You need to add the fallback option to the serve command, so that it will serve the index.html for all the routes (that is how Single Page Applications works)
2. Pass the `--cors` option to the serve command, so that it will add the `Access-Control-Allow-Origin: *` header to the responses. This is needed for the DICOMWeb requests to work.

```bash
cd platform/app;

npx serve . -l 8080 -s --cors
```

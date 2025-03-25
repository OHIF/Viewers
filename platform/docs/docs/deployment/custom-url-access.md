---
sidebar_position: 4
title: Custom URL Access/Build
---


## Build for non-root path

Sometimes it is desired to access the viewer from a non-root path (e.g., `/my-awesome-viewer` instead of `/`).
You can achieve so by using the `PUBLIC_URL` environment variable and/or the `routerBasename` configuration option.
The routerBasename will default to PUBLIC_URL if not otherwise set, so that PUBLIC_URL alone is sufficient
Using just routerBasename will only affect the path used to prefix the load paths, but will NOT affect the path used to
load the actual context files.  That allows using one system that reverse proxies to another one for the root page, but
fetches from the back end server directly for everything else.

1. use a config (e.g. `config/myConfig.js`) file that is using the `routerBasename` of your choice `/myAwesomeViewer` (note there is only one / - it is not /myAwesomeViewer/).
2. build the viewer with `PUBLIC_URL=/my-awesome-viewer/` (note there are two / - it is not /my-awesome-viewer).

That will fetch files just as javascript from /my-awesome-viewer, but the paths in the base URL will be 'http://host/myAwesomeViewer'.


:::tip
The PUBLIC_URL tells the application where to find the static assets and the routerBasename will tell the application how to handle the routes
:::

:::tip
If you want to serve files from one server to another, you have to set both PUBLIC_URL and the routerBasename, where the
PUBLIC_URL must have the full server name to redirect to, while the routerBasename must use a relative local path.
:::


### Testing in Development
For testing the build locally, you can use the following command:

```bash
# we use default config file
PUBLIC_URL=/my-awesome-viewer/ APP_CONFIG=config/default.js yarn dev
```


### Testing in Build (production)
You need to build the viewer with the following command:

```bash
PUBLIC_URL=/my-awesome-viewer/ APP_CONFIG=config/default.js yarn build
```

We can use the `npx serve` to serve the build folder. There are two things you need to consider however,
1. You need to change the `public/serve.json` file to reflect the new routerBasename in the destination (see the example below)


```json
// final serve.json
{
  "rewrites": [{ "source": "*", "destination": "my-awesome-viewer/index.html" }],
}
```

```bash
cd platform/app;

# rename the dist folder to my-awesome-viewer
mv dist my-awesome-viewer

# serve the folder with custom json, note that we are using ../public/serve.json and NOT public/serve.json
npx serve  -c ./public/serve.json
```


:::note
When you want to authenticate against a sub path, there are a few things you should keep in mind:

1. Set the `routerBasename` to the sub path and also update the `PUBLIC_URL` to match the sub path.
2. Don't forget to modify the `serve.json` file as mentioned earlier.
3. Ensure that the sub path is included in the list of allowed callback URLs. For example, in the Google Cloud dashboard, you can set it in the `Authorized redirect URIs` field under the `Credentials` section of the `APIs & Services` menu.
:::

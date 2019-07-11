# OHIF Medical Imaging Platform

```bash
# Flip workspaces flag
yarn config set workspaces-experimental true

# Force install
yarn install --force

# Link
# Redundent with yarn workspaces
npx lerna bootstrap
```

```bash
# Link for local dev
cd ./extensions/my-package
npx lerna add @ohif/my-package --scope=@ohif/my-package-consumer
```

```bash
# Add shared dev dependency for workspace
yarn add --dev -W package-name
```

// module vs main vs jsnext:main vs browser
https://babeljs.io/blog/2018/06/26/on-consuming-and-publishing-es2015+-packages

Webpack: https://webpack.js.org/configuration/resolve/

UMD builds go through

- index.umd.js
- Extensions passed in via window config

PWA builds go through

- index.js
- Extensions specified in file or by window config

> The module property should point to a script that utilizes ES2015 module
> syntax but no other syntax features that aren't yet supported by browsers or
> node. This enables webpack to parse the module syntax itself, allowing for
> lighter bundles via tree shaking if users are only consuming certain parts of
> the library.

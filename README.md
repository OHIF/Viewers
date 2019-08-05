# OHIF Medical Imaging Platform

[![lerna][lerna-image]][lerna-url]
[![Netlify Status][netlify-image]][netlify-url]

## The Problem

...

## Why Choose Us

...

## Quick Start

...

## Commands

### Global

| Commands        |     |                                                       |
| --------------- | --- | ----------------------------------------------------- |
| `build:package` |     | Builds commonjs bundles for all projects              |
| `test:unit`     |     | Jest multi-project test runner; overall coverage      |
| `test:unit:ci`  |     | Runs tests in parallel. Reports coverage per project. |

### Local

| Commands       |     |                                                   |
| -------------- | --- | ------------------------------------------------- |
| `test:unit`    |     | Runs tests while watching for changes             |
| `test:unit:ci` |     | Runs tests, collects coverage, reports to codecov |

## Developing

The OHIF Medical Image Viewing Platform is maintained as a
[`monorepo`][monorepo]. This means that this repository, instead of containing a
single project, contains many projects. If you explore our project structure,
you'll see the following:

```bash
.
├── extensions              #
│   ├── _example            # Skeleton of example extension
│   ├── cornerstone         # 2D images w/ Cornerstone.js
│   ├── dicom-html          # Structured Reports as HTML in viewport
│   ├── dicom-microscopy    # Whole slide microscopy viewing
│   ├── dicom-pdf           # View DICOM wrapped PDFs in viewport
│   └── vtk                 # MPR and Volume support w/ VTK.js
│
├── platform                #
│   ├── core                # Business Logic
│   ├── i18n                # Internationalization Support
│   ├── ui                  # React component library
│   └── viewer              # Connects platform and extension projects
│
├── ...                     # misc. shared configuration
├── lerna.json              # MonoRepo (Lerna) settings
├── package.json            # Shared devDependencies and commands
└── README.md               # This file
```

Want to better understand why and how we've structured this repository? Read
more about it in our [Architecture Documentation](#todo).

### Requirements

- [Yarn 1.17.3+](https://yarnpkg.com/en/docs/install)
- [Node 8+](https://nodejs.org/en/)
- Yarn Workspaces should be enabled on your machine:
  - `yarn config set workspaces-experimental true`

### Getting Started

1. [Fork this repository][how-to-fork]
2. [Clone your forked repository][how-to-clone]
   - `git clone https://github.com/YOUR-USERNAME/Viewers.git`
3. Navigate to the cloned project's directory
4. Add this repo as a `remote` named `upstream`
   - `git remote add upstream https://github.com/OHIF/Viewers.git`
5. `yarn install` to restore dependencies and link projects

#### To Develop

```bash
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

## Notes

Lerna requires `GH_TOKEN` for GitHub authentication token

<!--
  Links
  -->

<!-- prettier-ignore-start -->
<!-- Badges -->
[lerna-image]: https://img.shields.io/badge/maintained%20with-lerna-cc00ff.svg
[lerna-url]: https://lerna.js.org/
[netlify-image]: https://api.netlify.com/api/v1/badges/a5d369ab-18a6-41c3-bcde-83805205ac7f/deploy-status
[netlify-url]: https://app.netlify.com/sites/ohif/deploys
<!-- Links -->
[monorepo]: https://en.wikipedia.org/wiki/Monorepo
[how-to-fork]: https://help.github.com/en/articles/fork-a-repo
[how-to-clone]: https://help.github.com/en/articles/fork-a-repo#step-2-create-a-local-clone-of-your-fork


<!-- prettier-ignore-end -->

<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<div align="center">
  <h1>OHIF Medical Imaging Viewer</h1>
  <p><strong>The OHIF Viewer</strong> is a zero-footprint medical image viewer provided by the <a href="http://ohif.org/">Open Health Imaging Foundation (OHIF)</a>. It is a configurable and extensible progressive web application with out-of-the-box support for image archives which support <a href="https://www.dicomstandard.org/dicomweb/">DICOMweb</a>.</p>
</div>


<div align="center">
  <a href="https://docs.ohif.org/"><strong>Read The Docs</strong></a> |
  <a href="https://github.com/OHIF/Viewers/tree/master/docs/latest">Edit the docs</a>
</div>
<div align="center">
  <a href="https://docs.ohif.org/demo">Demo</a> |
  <a href="https://ohif.canny.io/">Roadmap</a> |
  <a href="https://react.ohif.org/">Component Library</a>
</div>


<hr />

[![NPM version][npm-version-image]][npm-url]
[![NPM downloads][npm-downloads-image]][npm-url]
[![Pulls][docker-pulls-img]][docker-image-url]
[![MIT License][license-image]][license-url]

[![Netlify Status][netlify-image]][netlify-url]
[![CircleCI][circleci-image]][circleci-url]
[![codecov][codecov-image]][codecov-url]
[![All Contributors](https://img.shields.io/badge/all_contributors-10-orange.svg?style=flat-square)](#contributors)

## What?

The OHIF Medical Imaging Viewer is for viewing medical images. It can retrieve and load images from most sources and formats; render sets in 2D, 3D, and reconstructed representations; allows for the manipulation, annotation, and serialization of observations; supports internationalization, OpenID Connect, offline use, hotkeys, and many more features.

Almost everything offers some degree of customization and configuration. If it doesn't support something you need, we accept pull requests and have an ever improving Extension System.

## Why Choose Us

### Community & Experience

The OHIF Viewer is a collaborative effort that has served as the basis for many active, production, and FDA Cleared medical imaging viewers. It benefits from our extensive community's collective experience, and from the sponsored contributions of individuals, research groups, and commercial organizations.

### Built to Adapt

...


### Support

...

## Quick Start Deployment

> This is only one of many ways to configure and deploy the OHIF Viewer. To learn more about your options, and how to choose the best one for your requirements, check out [our deployment recipes and documentation](https://docs.ohif.org/deployment/).

The fastest and easiest way to get started is to include the OHIF Viewer with a script tag. In practice, this is as simple as:

- Including the following dependencies with script tags:
   - [React](https://unpkg.com/react@16/umd/react.production.min.js)
   - [React Dom](https://unpkg.com/react-dom@16/umd/react-dom.production.min.js)
   - The [OHIF Viewer](https://unpkg.com/ohif-viewer@0.19.5/dist/index.umd.js)
- Have an element with an ID of `root` on the page
- Configure the OHIF Viewer at `window.config`:

```js
window.config = {
  routerBasename: "/",
  servers: {
    dicomWeb: [
      {
        name: "DCM4CHEE",
        qidoRoot: "https://server.dcmjs.org/dcm4chee-arc/aets/DCM4CHEE/rs",
        wadoRoot: "https://server.dcmjs.org/dcm4chee-arc/aets/DCM4CHEE/rs",
        qidoSupportsIncludeField: true,
        imageRendering: "wadors",
        thumbnailRendering: "wadors"
      }
    ]
  }
};
```

- Install the viewer: `window.OHIFStandaloneViewer.installViewer(window.config);`

This exact setup is demonstrated in this [CodeSandbox](https://codesandbox.io/s/ohif-viewer-script-tag-usage-c4u4t) and in our [Embedding The Viewer](https://docs.ohif.org/deployment/recipes/embedded-viewer.html) deployment recipe.

## Developing

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

_From this repository's root directory:_

```bash
# Enable Yarn Workspaces
yarn config set workspaces-experimental true

# Restore dependencies
yarn install
```

## Commands

These commands are available from the root directory. Each project directory also supports a number of commands that can be found in their respective `README.md` and `project.json` files.

| Yarn Commands        | Description                                                   |
| -------------------- | ------------------------------------------------------------- |
| **Develop**          |                                                               |
| `dev` or `start`     | Default development experience for Viewer                     |
| `dev:project <package-name>` | Replace with `core`, `ui`, `i18n`, `cornerstone`, `vtk`, etc. |
| `test:unit`          | Jest multi-project test runner; overall coverage              |
| **Deploy**           |                                                               |
| `build`*             | Builds production output for our PWA Viewer                   |
| `build:package`*             | Builds production `commonjs` output for our Viewer                 |
| `build:package-all`*     | Builds commonjs bundles for all projects                      |


\* - For more information on our different builds, check out our [Deploy Docs][deployment-docs]

## Projects

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
more about it in our [Architecture Documentation][ohif-architecture].

### Platform

These projects comprise the

| Name                            | Description | Links |
| ------------------------------- | ----------- | ----- |
| [@ohif/core][platform-core]     |             | NPM   |
| [@ohif/i18n][platform-i18n]     |             | NPM   |
| [@ohif/viewer][platform-viewer] |             | NPM   |
| [@ohif/ui][platform-ui]         |             | NPM   |

### Extensions

This is a list of Extensions maintained by the OHIF Core team. It's possible to customize and configure these extensions, and you can even create your own. You can [read more about extensions here][ohif-extensions].

| Name                                                           | Description | Links |
| -------------------------------------------------------------- | ----------- | ----- |
| [@ohif/extension-cornestone][extension-cornerstone]            |             | NPM   |
| [@ohif/extension-dicom-html][extension-dicom-html]             |             | NPM   |
| [@ohif/extension-dicom-microscopy][extension-dicom-microscopy] |             | NPM   |
| [@ohif/extension-dicom-pdf][extension-dicom-pdf]               |             | NPM   |
| [@ohif/extension-vtk][extension-vtk]                           |             | NPM   |

## Acknowledgments

To acknowledge the OHIF Viewer in an academic publication, please cite

> _LesionTracker: Extensible Open-Source Zero-Footprint Web Viewer for Cancer
> Imaging Research and Clinical Trials_
>
> Trinity Urban, Erik Ziegler, Rob Lewis, Chris Hafey, Cheryl Sadow, Annick D.
> Van den Abbeele and Gordon J. Harris
>
> _Cancer Research_, November 1 2017 (77) (21) e119-e122 DOI:
> [10.1158/0008-5472.CAN-17-0334](https://www.doi.org/10.1158/0008-5472.CAN-17-0334)

**Note:** If you use or find this repository helpful, please take the time to
star this repository on Github. This is an easy way for us to assess adoption
and it can help us obtain future funding for the project.

This work is supported primarily by the National Institutes of Health, National
Cancer Institute, Informatics Technology for Cancer Research (ITCR) program,
under a
[grant to Dr. Gordon Harris at Massachusetts General Hospital (U24 CA199460)](https://projectreporter.nih.gov/project_info_description.cfm?aid=8971104).

## License

MIT © [OHIF](https://github.com/OHIF)

<!--
  Links
  -->

<!-- prettier-ignore-start -->
<!-- Badges -->
[lerna-image]: https://img.shields.io/badge/maintained%20with-lerna-cc00ff.svg
[lerna-url]: https://lerna.js.org/
[netlify-image]: https://api.netlify.com/api/v1/badges/a5d369ab-18a6-41c3-bcde-83805205ac7f/deploy-status
[netlify-url]: https://app.netlify.com/sites/ohif/deploys
[all-contributors-image]: https://img.shields.io/badge/all_contributors-0-orange.svg?style=flat-square
[contributing-url]: https://github.com/OHIF/Viewers/blob/react/CONTRIBUTING.md
[circleci-image]: https://circleci.com/gh/OHIF/Viewers.svg?style=svg
[circleci-url]: https://circleci.com/gh/OHIF/Viewers
[codecov-image]: https://codecov.io/gh/OHIF/Viewers/branch/react/graph/badge.svg
[codecov-url]: https://codecov.io/gh/OHIF/Viewers/branch/react
[prettier-image]: https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square
[prettier-url]: https://github.com/prettier/prettier
[semantic-image]: https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg
[semantic-url]: https://github.com/semantic-release/semantic-release
<!-- ROW -->
[npm-url]: https://npmjs.org/package/ohif-viewer
[npm-downloads-image]: https://img.shields.io/npm/dm/ohif-viewer.svg?style=flat-square
[npm-version-image]: https://img.shields.io/npm/v/ohif-viewer.svg?style=flat-square
[docker-pulls-img]: https://img.shields.io/docker/pulls/ohif/viewer.svg?style=flat-square
[docker-image-url]: https://hub.docker.com/r/ohif/viewer
[license-image]: https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square
[license-url]: LICENSE
<!-- Links -->
[monorepo]: https://en.wikipedia.org/wiki/Monorepo
[how-to-fork]: https://help.github.com/en/articles/fork-a-repo
[how-to-clone]: https://help.github.com/en/articles/fork-a-repo#step-2-create-a-local-clone-of-your-fork
[ohif-architecture]: https://docs.ohif.org/advanced/architecture.html
[ohif-extensions]: https://docs.ohif.org/advanced/architecture.html
[deployment-docs]: https://docs.ohif.org/deployment/
[react-url]: https://reactjs.org/
[pwa-url]: https://developers.google.com/web/progressive-web-apps/
[ohif-viewer-url]: https://www.npmjs.com/package/ohif-viewer
[configuration-url]: https://docs.ohif.org/essentials/configuration.html
[extensions-url]: https://docs.ohif.org/advanced/extensions.html
<!-- Platform -->
[platform-core]: platform/core/README.md
[platform-i18n]: platform/i18n/README.md
[platform-ui]: platform/ui/README.md
[platform-viewer]: platform/viewer/README.md
<!-- Extensions -->
[extension-cornerstone]: extensions/cornerstone/README.md
[extension-dicom-html]: extensions/dicom-html/README.md
[extension-dicom-microscopy]: extensions/dicom-microscopy/README.md
[extension-dicom-pdf]: extensions/dicom-pdf/README.md
[extension-vtk]: extensions/vtk/README.md
<!-- prettier-ignore-end -->

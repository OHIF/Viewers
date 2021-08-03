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
  <a href="https://viewer.ohif.org/">Live Demo</a> |
  <a href="https://react.ohif.org/">Component Library</a>
</div>


<hr />

[![NPM version][npm-version-image]][npm-url]
[![NPM downloads][npm-downloads-image]][npm-url]
[![Pulls][docker-pulls-img]][docker-image-url]
[![MIT License][license-image]][license-url]
[![FOSSA Status](https://app.fossa.io/api/projects/git%2Bgithub.com%2FOHIF%2FViewers.svg?type=shield)](https://app.fossa.io/projects/git%2Bgithub.com%2FOHIF%2FViewers?ref=badge_shield)

[![Netlify Status][netlify-image]][netlify-url]
[![CircleCI][circleci-image]][circleci-url]
[![codecov][codecov-image]][codecov-url]
[![This project is using Percy.io for visual regression testing.][percy-image]](percy-url)
[![All Contributors](https://img.shields.io/badge/all_contributors-10-orange.svg?style=flat-square)](#contributors)
<!-- prettier-ignore-end -->

## About

The OHIF Medical Imaging Viewer is for viewing medical images. It can retrieve
and load images from most sources and formats; render sets in 2D, 3D, and
reconstructed representations; allows for the manipulation, annotation, and
serialization of observations; supports internationalization, OpenID Connect,
offline use, hotkeys, and many more features.

Almost everything offers some degree of customization and configuration. If it
doesn't support something you need, we accept pull requests and have an ever
improving Extension System.

## Why Choose Us

### Community & Experience

The OHIF Viewer is a collaborative effort that has served as the basis for many
active, production, and FDA Cleared medical imaging viewers. It benefits from
our extensive community's collective experience, and from the sponsored
contributions of individuals, research groups, and commercial organizations.

### Built to Adapt

After more than 5-years of integrating with many companies and organizations,
The OHIF Viewer has been rebuilt from the ground up to better address the
varying workflow and configuration needs of its many users. All of the Viewer's
core features are built using it's own extension system. The same extensibility
that allows us to offer:

- 2D and 3D medical image viewing
- Multiplanar Reconstruction (MPR)
- Maximum Intensity Project (MIP)
- Whole slide microscopy viewing
- PDF and Dicom Structured Report rendering
- User Access Control (UAC)
- Context specific toolbar and side panel content
- and many others

Can be leveraged by you to customize the viewer for your workflow, and to add
any new functionality you may need (and wish to maintain privately without
forking).

### Support

We offer support through
[GitHub Issues](https://github.com/OHIF/Viewers/issues/new/choose). You can:

- [Report a Bug 🐛](https://github.com/OHIF/Viewers/issues/new?assignees=&labels=Community%3A+Report+%3Abug%3A&template=---bug-report.md)
- [Request a Feature 🚀](https://github.com/OHIF/Viewers/issues/new?assignees=&labels=Community%3A+Request+%3Ahand%3A&template=---feature-request.md)
- [Ask a Question 🤗](https://github.com/OHIF/Viewers/issues/new?assignees=&labels=Community%3A+Question+%3Aquestion%3A&template=---support-question.md)

For commercial support, academic collaberations, and answers to common
questions; please read our
[documented FAQ](https://docs.ohif.org/faq/index.html#does-ohif-offer-commercial-support).

## Quick Start Deployment

> This is only one of many ways to configure and deploy the OHIF Viewer. To
> learn more about your options, and how to choose the best one for your
> requirements, check out
> [our deployment recipes and documentation](https://docs.ohif.org/deployment/).

The fastest and easiest way to get started is to include the OHIF Viewer with a
script tag. In practice, this is as simple as:

- Including the following dependencies with script tags:
  - [React](https://unpkg.com/react@16/umd/react.production.min.js)
  - [React Dom](https://unpkg.com/react-dom@16/umd/react-dom.production.min.js)
  - The [OHIF Viewer](https://unpkg.com/@ohif/viewer)
- Have an element with an ID of `root` on the page
- Configure the OHIF Viewer at `window.config`:

```js
window.config = {
  routerBasename: '/',
  servers: {
    dicomWeb: [
      {
        name: 'DCM4CHEE',
        qidoRoot: 'https://server.dcmjs.org/dcm4chee-arc/aets/DCM4CHEE/rs',
        wadoRoot: 'https://server.dcmjs.org/dcm4chee-arc/aets/DCM4CHEE/rs',
        qidoSupportsIncludeField: true,
        imageRendering: 'wadors',
        thumbnailRendering: 'wadors',
      },
    ],
  },
};
```

- Install the viewer: `window.OHIFViewer.installViewer(window.config);`

This exact setup is demonstrated in this
[CodeSandbox](https://codesandbox.io/s/viewer-script-tag-tprch) and in our
[Embedding The Viewer](https://docs.ohif.org/deployment/recipes/embedded-viewer.html)
deployment recipe.

## Developing

### Requirements

- [Yarn 1.17.3+](https://yarnpkg.com/en/docs/install)
- [Node 10+](https://nodejs.org/en/)
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

These commands are available from the root directory. Each project directory
also supports a number of commands that can be found in their respective
`README.md` and `project.json` files.

| Yarn Commands                | Description                                                   |
| ---------------------------- | ------------------------------------------------------------- |
| **Develop**                  |                                                               |
| `dev` or `start`             | Default development experience for Viewer                     |
| `dev:project <package-name>` | Replace with `core`, `ui`, `i18n`, `cornerstone`, `vtk`, etc. |
| `test:unit`                  | Jest multi-project test runner; overall coverage              |
| **Deploy**                   |                                                               |
| `build`\*                    | Builds production output for our PWA Viewer                   |
| `build:package`\*            | Builds production `commonjs` output for our Viewer            |
| `build:package-all`\*        | Builds commonjs bundles for all projects                      |

\* - For more information on our different builds, check out our [Deploy
Docs][deployment-docs]

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

| Name                            | Description                                                                                          | Links             |
| ------------------------------- | ---------------------------------------------------------------------------------------------------- | ----------------- |
| [@ohif/core][platform-core]     | Business logic and classes that model the data, services, and extensions that are framework agnostic | [NPM][core-npm]   |
| [@ohif/i18n][platform-i18n]     | Language files and small API for wrapping component/ui text for translations                         | [NPM][i18n-npm]   |
| [@ohif/viewer][platform-viewer] | The OHIF Viewer. Where we consume and configure all platform library's and extensions                | [NPM][viewer-npm] |
| [@ohif/ui][platform-ui]         | Reusable React components we consume and compose to build our Viewer's UI                            | [NPM][ui-npm]     |

### Extensions

This is a list of Extensions maintained by the OHIF Core team. It's possible to
customize and configure these extensions, and you can even create your own. You
can [read more about extensions here][ohif-extensions].

| Name                                                           | Description                                             | Links                  |
| -------------------------------------------------------------- | ------------------------------------------------------- | ---------------------- |
| [@ohif/extension-cornestone][extension-cornerstone]            | 2D image viewing, annotation, and segementation tools   | [NPM][cornerstone-npm] |
| [@ohif/extension-dicom-html][extension-dicom-html]             | Support for viewing DICOM SR as rendered HTML           | [NPM][html-npm]        |
| [@ohif/extension-dicom-microscopy][extension-dicom-microscopy] | Whole slide microscopy viewing                          | [NPM][microscopy-npm]  |
| [@ohif/extension-dicom-pdf][extension-dicom-pdf]               | View DICOM wrapped PDFs in a viewport                   | [NPM][pdf-npm]         |
| [@ohif/extension-vtk][extension-vtk]                           | Volume rendering, reconstruction, and 3D visualizations | [NPM][vtk-npm]         |

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

## Projects that contributed to OHIF Viewer

The following is a (partial) list of projects that contributed resources towards
development of OHIF Viewer:

- [NCI Imaging Data Commons (IDC) project](https://imaging.datacommons.cancer.gov/)
  supported development of new features and bug fixes marked with
  ["IDC:priority"](https://github.com/OHIF/Viewers/issues?q=is%3Aissue+is%3Aopen+label%3AIDC%3Apriority),
  ["IDC:candidate"](https://github.com/OHIF/Viewers/issues?q=is%3Aissue+is%3Aopen+label%3AIDC%3Acandidate)
  or
  ["IDC:collaboration"](https://github.com/OHIF/Viewers/issues?q=is%3Aissue+is%3Aopen+label%3AIDC%3Acollaboration).
  NCI Imaging Data Commons is supported by the contract number 19X037Q from
  Leidos Biomedical Research under Task Order HHSN26100071 from NCI.
  [IDC Viewer](https://learn.canceridc.dev/portal/visualization) is a customized
  version of the OHIF Viewer.

## License

MIT © [OHIF](https://github.com/OHIF)

<!--
  Links
  -->

<!-- prettier-ignore-start -->
<!-- Badges -->
[lerna-image]: https://img.shields.io/badge/maintained%20with-lerna-cc00ff.svg
[lerna-url]: https://lerna.js.org/
[netlify-image]: https://api.netlify.com/api/v1/badges/32708787-c9b0-4634-b50f-7ca41952da77/deploy-status
[netlify-url]: https://app.netlify.com/sites/ohif-dev/deploys
[all-contributors-image]: https://img.shields.io/badge/all_contributors-0-orange.svg?style=flat-square
[circleci-image]: https://circleci.com/gh/OHIF/Viewers.svg?style=svg
[circleci-url]: https://circleci.com/gh/OHIF/Viewers
[codecov-image]: https://codecov.io/gh/OHIF/Viewers/branch/master/graph/badge.svg
[codecov-url]: https://codecov.io/gh/OHIF/Viewers/branch/master
[prettier-image]: https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square
[prettier-url]: https://github.com/prettier/prettier
[semantic-image]: https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg
[semantic-url]: https://github.com/semantic-release/semantic-release
<!-- ROW -->
[npm-url]: https://npmjs.org/package/@ohif/viewer
[npm-downloads-image]: https://img.shields.io/npm/dm/@ohif/viewer.svg?style=flat-square
[npm-version-image]: https://img.shields.io/npm/v/@ohif/viewer.svg?style=flat-square
[docker-pulls-img]: https://img.shields.io/docker/pulls/ohif/viewer.svg?style=flat-square
[docker-image-url]: https://hub.docker.com/r/ohif/viewer
[license-image]: https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square
[license-url]: LICENSE
[percy-image]: https://percy.io/static/images/percy-badge.svg
[percy-url]: https://percy.io/Open-Health-Imaging-Foundation/OHIF-Viewer
<!-- Links -->
[monorepo]: https://en.wikipedia.org/wiki/Monorepo
[how-to-fork]: https://help.github.com/en/articles/fork-a-repo
[how-to-clone]: https://help.github.com/en/articles/fork-a-repo#step-2-create-a-local-clone-of-your-fork
[ohif-architecture]: https://docs.ohif.org/architecture/index.html
[ohif-extensions]: https://docs.ohif.org/architecture/index.html
[deployment-docs]: https://docs.ohif.org/deployment/
[react-url]: https://reactjs.org/
[pwa-url]: https://developers.google.com/web/progressive-web-apps/
[ohif-viewer-url]: https://www.npmjs.com/package/@ohif/viewer
[configuration-url]: https://docs.ohif.org/configuring/
[extensions-url]: https://docs.ohif.org/extensions/
<!-- Platform -->
[platform-core]: platform/core/README.md
[core-npm]: https://www.npmjs.com/package/@ohif/core
[platform-i18n]: platform/i18n/README.md
[i18n-npm]: https://www.npmjs.com/package/@ohif/i18n
[platform-ui]: platform/ui/README.md
[ui-npm]: https://www.npmjs.com/package/@ohif/ui
[platform-viewer]: platform/viewer/README.md
[viewer-npm]: https://www.npmjs.com/package/@ohif/viewer
<!-- Extensions -->
[extension-cornerstone]: extensions/cornerstone/README.md
[cornerstone-npm]: https://www.npmjs.com/package/@ohif/extension-cornerstone
[extension-dicom-html]: extensions/dicom-html/README.md
[html-npm]: https://www.npmjs.com/package/@ohif/extension-dicom-html
[extension-dicom-microscopy]: extensions/dicom-microscopy/README.md
[microscopy-npm]: https://www.npmjs.com/package/@ohif/extension-dicom-microscopy
[extension-dicom-pdf]: extensions/dicom-pdf/README.md
[pdf-npm]: https://www.npmjs.com/package/@ohif/extension-dicom-pdf
[extension-vtk]: extensions/vtk/README.md
[vtk-npm]: https://www.npmjs.com/package/@ohif/extension-vtk
<!-- prettier-ignore-end -->

[![FOSSA Status](https://app.fossa.io/api/projects/git%2Bgithub.com%2FOHIF%2FViewers.svg?type=large)](https://app.fossa.io/projects/git%2Bgithub.com%2FOHIF%2FViewers?ref=badge_large)

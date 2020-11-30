<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<div align="center">
  <h1>@ohif/viewer</h1>
  <p><strong>@ohif/viewer</strong> is a zero-footprint medical image viewer provided by the <a href="http://ohif.org/">Open Health Imaging Foundation (OHIF)</a>. It is a configurable and extensible progressive web application with out-of-the-box support for image archives which support <a href="https://www.dicomstandard.org/dicomweb/">DICOMweb</a>.</p>
</div>


<div align="center">
  <a href="https://docs.ohif.org/"><strong>Read The Docs</strong></a> |
  <a href="https://github.com/OHIF/Viewers/tree/master/docs/latest">Edit the docs</a>
</div>
<div align="center">
  <a href="https://docs.ohif.org/demo">Demo</a> |
  <a href="https://react.ohif.org/">Component Library</a>
</div>


<hr />

[![NPM version][npm-version-image]][npm-url]
[![NPM downloads][npm-downloads-image]][npm-url]
[![Pulls][docker-pulls-img]][docker-image-url]
[![All Contributors](https://img.shields.io/badge/all_contributors-9-orange.svg?style=flat-square)](#contributors)
[![MIT License][license-image]][license-url]
<!-- markdownlint-enable -->
<!-- prettier-ignore-end -->

> ATTENTION: If you are looking for Version 1 (the Meteor Version) of this
> repository, it lives on
> [the `v1.x` branch](https://github.com/OHIF/Viewers/tree/v1.x)

## Why?

Building a web based medical imaging viewer from scratch is time intensive, hard
to get right, and expensive. Instead of re-inventing the wheel, you can use the
OHIF Viewer as a rock solid platform to build on top of. The Viewer is a
[React][react-url] [Progressive Web Application][pwa-url] that can be embedded
in existing applications via it's [packaged source
(ohif-viewer)][ohif-viewer-url] or hosted stand-alone. The Viewer exposes
[configuration][configuration-url] and [extensions][extensions-url] to support
workflow customization and advanced functionality at common integration points.

If you're interested in using the OHIF Viewer, but you're not sure it supports
your use case [check out our docs](https://docs.ohif.org/). Still not sure, or
you would like to propose new features? Don't hesitate to
[create an issue](https://github.com/OHIF/Viewers/issues) or open a pull
request.

## Getting Started

This readme is specific to testing and developing locally. If you're more
interested in production deployment strategies,
[you can check out our documentation on publishing](https://docs.ohif.org/).

Want to play around before you dig in?
[Check out our LIVE Demo](https://viewer.ohif.org/)

### Setup

_Requirements:_

- [NodeJS & NPM](https://nodejs.org/en/download/)
- [Yarn](https://yarnpkg.com/lang/en/docs/install/)

_Steps:_

1. Fork this repository
2. Clone your forked repository (your `origin`)

- `git clone git@github.com:YOUR_GITHUB_USERNAME/Viewers.git`

3. Add `OHIF/Viewers` as a `remote` repository (the `upstream`)

- `git remote add upstream git@github.com:OHIF/Viewers.git`

### Developing Locally

In your cloned repository's root folder, run:

```js
// Restore dependencies
yarn install

// Stands up local server to host Viewer.
// Viewer connects to our public cloud PACS by default
yarn start
```

For more advanced local development scenarios, like using your own locally
hosted PACS and test data,
[check out our Essential: Getting Started](https://docs.ohif.org/getting-started.html)
guide.

### E2E Tests

Using [Cypress](https://www.cypress.io/) to create End-to-End tests and check
whether the application flow is performing correctly, ensuring that the
integrated components are working as expected.

#### Why Cypress?

Cypress is a next generation front end testing tool built for the modern web.
With Cypress is easy to set up, write, run and debug tests

It allow us to write different types of tests:

- End-to-End tests
- Integration tests
- Unit tets

All tests must be in `./cypress/integration` folder.

Commands to run the tests:

```js
// Open Cypress Dashboard that provides insight into what happened when your tests ran
yarn test:e2e

// Run all tests using Electron browser headless
yarn test:e2e:local

// Run all tests in CI mode
yarn run test:e2e:ci
```

### Contributing

> Large portions of the Viewer's functionality are maintained in other
> repositories. To get a better understanding of the Viewer's architecture and
> "where things live", read
> [our docs on the Viewer's architecture](https://docs.ohif.org/architecture/index.html#overview)

It is notoriously difficult to setup multiple dependent repositories for
end-to-end testing and development. That's why we recommend writing and running
unit tests when adding and modifying features. This allows us to program in
isolation without a complex setup, and has the added benefit of producing
well-tested business logic.

1. Clone this repository
2. Navigate to the project directory, and `yarn install`
3. To begin making changes, `yarn run dev`
4. To commit changes, run `yarn run cm`

When creating tests, place the test file "next to" the file you're testing.
[For example](https://github.com/OHIF/Viewers/blob/master/src/utils/index.test.js):

```js
// File
index.js;

// Test for file
index.test.js;
```

As you add and modify code, `jest` will watch for uncommitted changes and run
your tests, reporting the results to your terminal. Make a pull request with
your changes to `master`, and a core team member will review your work. If you
have any questions, please don't hesitate to reach out via a GitHub issue.

## Contributors

Thanks goes to these wonderful people
([emoji key](https://allcontributors.org/docs/en/emoji-key)):

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore -->
<table><tr><td align="center"><a href="https://github.com/swederik"><img src="https://avatars3.githubusercontent.com/u/607793?v=4" width="100px;" alt="Erik Ziegler"/><br /><sub><b>Erik Ziegler</b></sub></a><br /><a href="https://github.com/OHIF/Viewers/commits?author=swederik" title="Code">💻</a> <a href="#infra-swederik" title="Infrastructure (Hosting, Build-Tools, etc)">🚇</a></td><td align="center"><a href="https://github.com/evren217"><img src="https://avatars1.githubusercontent.com/u/4920551?v=4" width="100px;" alt="Evren Ozkan"/><br /><sub><b>Evren Ozkan</b></sub></a><br /><a href="https://github.com/OHIF/Viewers/commits?author=evren217" title="Code">💻</a></td><td align="center"><a href="https://github.com/galelis"><img src="https://avatars3.githubusercontent.com/u/2378326?v=4" width="100px;" alt="Gustavo André Lelis"/><br /><sub><b>Gustavo André Lelis</b></sub></a><br /><a href="https://github.com/OHIF/Viewers/commits?author=galelis" title="Code">💻</a></td><td align="center"><a href="http://dannyrb.com/"><img src="https://avatars1.githubusercontent.com/u/5797588?v=4" width="100px;" alt="Danny Brown"/><br /><sub><b>Danny Brown</b></sub></a><br /><a href="https://github.com/OHIF/Viewers/commits?author=dannyrb" title="Code">💻</a> <a href="#infra-dannyrb" title="Infrastructure (Hosting, Build-Tools, etc)">🚇</a></td><td align="center"><a href="https://github.com/all-contributors/all-contributors-bot"><img src="https://avatars3.githubusercontent.com/u/46843839?v=4" width="100px;" alt="allcontributors[bot]"/><br /><sub><b>allcontributors[bot]</b></sub></a><br /><a href="https://github.com/OHIF/Viewers/commits?author=allcontributors" title="Documentation">📖</a></td><td align="center"><a href="https://www.linkedin.com/in/siliconvalleynextgeneration/"><img src="https://avatars0.githubusercontent.com/u/1230575?v=4" width="100px;" alt="Esref Durna"/><br /><sub><b>Esref Durna</b></sub></a><br /><a href="#question-EsrefDurna" title="Answering Questions">💬</a></td><td align="center"><a href="https://github.com/diego0020"><img src="https://avatars3.githubusercontent.com/u/7297450?v=4" width="100px;" alt="diego0020"/><br /><sub><b>diego0020</b></sub></a><br /><a href="https://github.com/OHIF/Viewers/commits?author=diego0020" title="Code">💻</a></td></tr><tr><td align="center"><a href="https://github.com/dlwire"><img src="https://avatars3.githubusercontent.com/u/1167291?v=4" width="100px;" alt="David Wire"/><br /><sub><b>David Wire</b></sub></a><br /><a href="https://github.com/OHIF/Viewers/commits?author=dlwire" title="Code">💻</a></td><td align="center"><a href="https://github.com/jfmedeiros1820"><img src="https://avatars1.githubusercontent.com/u/2211708?v=4" width="100px;" alt="João Felipe de Medeiros Moreira"/><br /><sub><b>João Felipe de Medeiros Moreira</b></sub></a><br /><a href="https://github.com/OHIF/Viewers/commits?author=jfmedeiros1820" title="Tests">⚠️</a></td></tr></table>

<!-- ALL-CONTRIBUTORS-LIST:END -->

This project follows the
[all-contributors](https://github.com/all-contributors/all-contributors)
specification. Contributions of any kind welcome!

## License

MIT © [OHIF](https://github.com/OHIF)

<!--
Links:
-->

<!-- prettier-ignore-start -->
[npm-url]: https://npmjs.org/package/ohif-viewer
[npm-downloads-image]: https://img.shields.io/npm/dm/ohif-viewer.svg?style=flat-square
[npm-version-image]: https://img.shields.io/npm/v/ohif-viewer.svg?style=flat-square
[docker-pulls-img]: https://img.shields.io/docker/pulls/ohif/viewer.svg?style=flat-square
[docker-image-url]: https://hub.docker.com/r/ohif/viewer
[all-contributors-image]: https://img.shields.io/badge/all_contributors-0-orange.svg?style=flat-square
[license-image]: https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square
[license-url]: LICENSE
<!-- DOCS -->
[react-url]: https://reactjs.org/
[pwa-url]: https://developers.google.com/web/progressive-web-apps/
[ohif-viewer-url]: https://www.npmjs.com/package/ohif-viewer
[configuration-url]: https://docs.ohif.org/configuring/
[extensions-url]: https://docs.ohif.org/extensions
<!-- Misc. -->
[react-viewer]: https://github.com/OHIF/Viewers/tree/react
<!-- Issue Boilerplate -->
[bugs]: https://github.com/OHIF/Viewers/labels/bug
[requests-feature]: https://github.com/OHIF/Viewers/labels/enhancement
[good-first-issue]: https://github.com/OHIF/Viewers/labels/good%20first%20issue
[google-group]: https://groups.google.com/forum/#!forum/cornerstone-platform

<!-- prettier-ignore-end -->

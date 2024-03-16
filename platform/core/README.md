<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<div align="center">
  <h1>@ohif/core</h1>
  <p><strong>@ohif/core</strong> is a collection of useful functions and classes for building web-based medical imaging applications. This library helps power OHIF's <a href="https://github.com/OHIF/Viewers">zero-footprint DICOM viewer</a>.</p>
</div>

<hr />

[![NPM version][npm-version-image]][npm-url]
[![NPM downloads][npm-downloads-image]][npm-url]
[![All Contributors](https://img.shields.io/badge/all_contributors-6-orange.svg?style=flat-square)](#contributors)
[![MIT License][license-image]][license-url]
<!-- markdownlint-enable -->
<!-- prettier-ignore-end -->

## Why?

This library offers pre-packaged solutions for features common to Web-based
medical imaging viewers. For example:

- Hotkeys
- DICOM Web
- Hanging Protocols
- Managing a study's measurements
- Managing a study's DICOM metadata
- A flexible pattern for extensions
- And many others

It does this while remaining decoupled from any particular view library or
rendering logic. While we use it to power our [React Viewer][react-viewer], it
can be used with Vue, React, Vanilla JS, or any number of other frameworks.

## Getting Started

The documentation for this library is sparse. The best way to get started is to
look at its
[top level exports](https://github.com/OHIF/Viewers/blob/master/platform/core/src/index.js),
and explore the source code of features that interest you. If you want to see
how we use this library, you can check out [our viewer
implementation][react-viewer].

### Install

> This library is pre- v1.0. All releases until a v1.0 have the possibility of
> introducing breaking changes. Please depend on an "exact" version in your
> projects to prevent issues caused by loose versioning.

```
// with npm
npm i @ohif/core --save-exact

// with yarn
yarn add @ohif/core --exact
```

### Usage

Usage is dependent on the feature(s) you want to leverage. The bulk of
`@ohif/core`'s features are "pure" and can be imported and used in place.

_Example: retrieving study metadata from a server_

```js
import { studies } from '@ohif/core';

const studiesMetadata = await studies.retrieveStudiesMetadata(
  server, // Object
  studyInstanceUIDs, // Array
  seriesInstanceUIDs // Array (optional)
);
```

### Contributing

It is notoriously difficult to setup multiple dependent repositories for
end-to-end testing and development. That's why we recommend writing and running
unit tests when adding and modifying features for this library. This allows us
to program in isolation without a complex setup, and has the added benefit of
producing well-tested business logic.

1. Clone this repository
2. Navigate to the project directory, and `yarn install`
3. To begin making changes, `yarn run dev`
4. To commit changes, run `yarn run cm`

When creating tests, place the test file "next to" the file you're testing.
[For example](https://github.com/OHIF/ohif-core/blob/master/src/index.test.js):

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
<table><tr><td align="center"><a href="https://github.com/swederik"><img src="https://avatars3.githubusercontent.com/u/607793?v=4" width="100px;" alt="Erik Ziegler"/><br /><sub><b>Erik Ziegler</b></sub></a><br /><a href="https://github.com/OHIF/ohif-core/commits?author=swederik" title="Code">💻</a></td><td align="center"><a href="https://github.com/evren217"><img src="https://avatars1.githubusercontent.com/u/4920551?v=4" width="100px;" alt="Evren Ozkan"/><br /><sub><b>Evren Ozkan</b></sub></a><br /><a href="https://github.com/OHIF/ohif-core/commits?author=evren217" title="Code">💻</a></td><td align="center"><a href="https://github.com/galelis"><img src="https://avatars3.githubusercontent.com/u/2378326?v=4" width="100px;" alt="Gustavo André Lelis"/><br /><sub><b>Gustavo André Lelis</b></sub></a><br /><a href="https://github.com/OHIF/ohif-core/commits?author=galelis" title="Code">💻</a></td><td align="center"><a href="http://dannyrb.com/"><img src="https://avatars1.githubusercontent.com/u/5797588?v=4" width="100px;" alt="Danny Brown"/><br /><sub><b>Danny Brown</b></sub></a><br /><a href="https://github.com/OHIF/ohif-core/commits?author=dannyrb" title="Code">💻</a></td><td align="center"><a href="https://github.com/all-contributors/all-contributors-bot"><img src="https://avatars3.githubusercontent.com/u/46843839?v=4" width="100px;" alt="allcontributors[bot]"/><br /><sub><b>allcontributors[bot]</b></sub></a><br /><a href="https://github.com/OHIF/ohif-core/commits?author=allcontributors" title="Documentation">📖</a></td><td align="center"><a href="https://github.com/ivan-aksamentov"><img src="https://avatars0.githubusercontent.com/u/9403403?v=4" width="100px;" alt="Ivan Aksamentov"/><br /><sub><b>Ivan Aksamentov</b></sub></a><br /><a href="https://github.com/OHIF/ohif-core/commits?author=ivan-aksamentov" title="Code">💻</a> <a href="https://github.com/OHIF/ohif-core/commits?author=ivan-aksamentov" title="Tests">⚠️</a></td></tr></table>

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
<!-- ROW -->
[npm-url]: https://npmjs.org/package/@ohif/core
[npm-downloads-image]: https://img.shields.io/npm/dm/@ohif/core.svg?style=flat-square
[npm-version-image]: https://img.shields.io/npm/v/@ohif/core.svg?style=flat-square
[all-contributors-image]: https://img.shields.io/badge/all_contributors-0-orange.svg?style=flat-square
[license-image]: https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square
[license-url]: LICENSE
<!-- Misc. -->
[react-viewer]: https://github.com/OHIF/Viewers/tree/react
<!-- prettier-ignore-end -->

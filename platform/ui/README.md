<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<div align="center">
  <h1>@ohif/ui</h1>

  <p><strong>@ohif/ui</strong> is a collection of components and utilities that power OHIF's <a href="https://github.com/OHIF/Viewers">zero-footprint DICOM viewer</a>.</p>
</div>

<div align="center">
<a href="https://react.ohif.org/"><strong>Read The Docs</strong></a> |
<a href="https://react.ohif.org/contributing">Edit the docs</a>

</div>

<hr />

[![NPM version][npm-version-image]][npm-url]
[![NPM downloads][npm-downloads-image]][npm-url]
[![All Contributors](https://img.shields.io/badge/all_contributors-13-orange.svg?style=flat-square)](#contributors)
[![MIT License][license-image]][license-url]
<!-- markdownlint-enable -->
<!-- prettier-ignore-end -->

This set of "Medical Imaging Viewer" React components are maintained separately
to:

- Decouple presentation from business logic
- Test and develop components in isolation
- Provide well documented, reusable components
- Aid rapid application development for context specific viewers

## Install

> This component library is pre- v1.0. All realeases until a v1.0 have the
> possibility of introducing breaking changes. Please depend on an "exact"
> version in your projects to prevent issues caused by loose versioning.

For full installation instructions, be sure to check out our
[getting started](https://react.ohif.org/getting-started#installation) guide.

```bash
// with npm
npm i @ohif/ui --save-exact

// with yarn
yarn add @ohif/ui --exact
```

## Usage

```jsx
import React, { Component } from 'react';
import { LayoutButton } from '@ohif/ui';

class Example extends Component {
  constructor(props) {
    super(props);

    this.state = {
      selectedCell: {
        className: 'hover',
        col: 1,
        row: 1,
      },
    };
  }

  render() {
    return (
      <LayoutButton
        selectedCell={this.state.selectedCell}
        onChange={cell => this.setState({ selectedCell: cell })}
      />
    );
  }
}
```

## Developing Locally

_Restore dependencies after cloning:_

```bash
# Restore workspace dependencies (from repository root)
yarn install

# From project root
yarn run dev:ui

# OR from this project's directory
yarn run dev

```

## Contributors ✨

Thanks goes to these wonderful people
([emoji key](https://allcontributors.org/docs/en/emoji-key)):

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore -->
<table><tr><td align="center"><a href="https://github.com/swederik"><img src="https://avatars3.githubusercontent.com/u/607793?v=4" width="100px;" alt="Erik Ziegler"/><br /><sub><b>Erik Ziegler</b></sub></a><br /><a href="https://github.com/OHIF/react-viewerbase/commits?author=swederik" title="Code">💻</a> <a href="#maintenance-swederik" title="Maintenance">🚧</a></td><td align="center"><a href="http://dannyrb.com/"><img src="https://avatars1.githubusercontent.com/u/5797588?v=4" width="100px;" alt="Danny Brown"/><br /><sub><b>Danny Brown</b></sub></a><br /><a href="https://github.com/OHIF/react-viewerbase/commits?author=dannyrb" title="Code">💻</a> <a href="#maintenance-dannyrb" title="Maintenance">🚧</a></td><td align="center"><a href="https://github.com/galelis"><img src="https://avatars3.githubusercontent.com/u/2378326?v=4" width="100px;" alt="Gustavo André Lelis"/><br /><sub><b>Gustavo André Lelis</b></sub></a><br /><a href="https://github.com/OHIF/react-viewerbase/commits?author=galelis" title="Code">💻</a> <a href="#maintenance-galelis" title="Maintenance">🚧</a></td><td align="center"><a href="https://github.com/maltempi"><img src="https://avatars3.githubusercontent.com/u/7017182?v=4" width="100px;" alt="Thiago Maltempi"/><br /><sub><b>Thiago Maltempi</b></sub></a><br /><a href="https://github.com/OHIF/react-viewerbase/commits?author=maltempi" title="Code">💻</a></td><td align="center"><a href="https://www.linkedin.com/in/siliconvalleynextgeneration/"><img src="https://avatars0.githubusercontent.com/u/1230575?v=4" width="100px;" alt="Esref Durna"/><br /><sub><b>Esref Durna</b></sub></a><br /><a href="https://github.com/OHIF/react-viewerbase/commits?author=EsrefDurna" title="Code">💻</a></td><td align="center"><a href="http://www.isomics.com"><img src="https://avatars0.githubusercontent.com/u/126077?v=4" width="100px;" alt="Steve Pieper"/><br /><sub><b>Steve Pieper</b></sub></a><br /><a href="https://github.com/OHIF/react-viewerbase/commits?author=pieper" title="Code">💻</a></td><td align="center"><a href="http://www.biharck.com.br"><img src="https://avatars0.githubusercontent.com/u/1713255?v=4" width="100px;" alt="Biharck Araujo"/><br /><sub><b>Biharck Araujo</b></sub></a><br /><a href="https://github.com/OHIF/react-viewerbase/commits?author=biharck" title="Code">💻</a></td></tr><tr><td align="center"><a href="https://rodrigoea.com/"><img src="https://avatars3.githubusercontent.com/u/1905961?v=4" width="100px;" alt="Rodrigo Antinarelli"/><br /><sub><b>Rodrigo Antinarelli</b></sub></a><br /><a href="https://github.com/OHIF/react-viewerbase/commits?author=rodrigolabs" title="Code">💻</a></td><td align="center"><a href="https://github.com/jfmedeiros1820"><img src="https://avatars1.githubusercontent.com/u/2211708?v=4" width="100px;" alt="João Felipe de Medeiros Moreira"/><br /><sub><b>João Felipe de Medeiros Moreira</b></sub></a><br /><a href="https://github.com/OHIF/react-viewerbase/commits?author=jfmedeiros1820" title="Code">💻</a></td><td align="center"><a href="https://github.com/jamesg1"><img src="https://avatars3.githubusercontent.com/u/3621147?v=4" width="100px;" alt="James Gosbell"/><br /><sub><b>James Gosbell</b></sub></a><br /><a href="https://github.com/OHIF/react-viewerbase/commits?author=jamesg1" title="Code">💻</a></td><td align="center"><a href="https://github.com/evren217"><img src="https://avatars1.githubusercontent.com/u/4920551?v=4" width="100px;" alt="Evren Ozkan"/><br /><sub><b>Evren Ozkan</b></sub></a><br /><a href="https://github.com/OHIF/react-viewerbase/commits?author=evren217" title="Code">💻</a></td><td align="center"><a href="https://github.com/zsaltzman"><img src="https://avatars1.githubusercontent.com/u/19156530?v=4" width="100px;" alt="Zach S."/><br /><sub><b>Zach S.</b></sub></a><br /><a href="https://github.com/OHIF/react-viewerbase/commits?author=zsaltzman" title="Code">💻</a></td><td align="center"><a href="https://github.com/muakdogan"><img src="https://avatars0.githubusercontent.com/u/19971240?v=4" width="100px;" alt="Mete Ugur Akdogan"/><br /><sub><b>Mete Ugur Akdogan</b></sub></a><br /><a href="https://github.com/OHIF/react-viewerbase/commits?author=muakdogan" title="Code">💻</a></td></tr></table>

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
[all-contributors-image]: https://img.shields.io/badge/all_contributors-0-orange.svg?style=flat-square
[npm-url]: https://npmjs.org/package/@ohif/ui
[npm-downloads-image]: https://img.shields.io/npm/dm/@ohif/ui.svg?style=flat-square
[npm-version-image]: https://img.shields.io/npm/v/@ohif/ui.svg?style=flat-square
[license-image]: https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square
[license-url]: LICENSE
<!-- prettier-ignore-end -->

# Build for Production

> If you've already followed the
> ["Getting Started" Guide](/essentials/getting-started.md), you can skip ahead
> to [Configuration](#configuration)

## Overview?

### Build Machine Requirements

- [Node.js & NPM](https://nodejs.org/en/download/)
- [Yarn](https://yarnpkg.com/lang/en/docs/install/)
- [Git](https://www.atlassian.com/git/tutorials/install-git)

### Getting the Code

_With Git:_

```bash
# Clone the remote repository to your local machine
git clone https://github.com/OHIF/Viewers.git

# Make sure the local code reflects the `react` version of the OHIF Viewer
git checkout react
```

More on: _[`git clone`](https://git-scm.com/docs/git-clone),
[`git checkout`](https://git-scm.com/docs/git-checkout)_

_From .zip:_

[OHIF/Viewers: react.zip](https://github.com/OHIF/Viewers/archive/react.zip)

### Restore Dependencies & Build

Open PowerShell, Terminal, or a Command Prompt, and navigate to the directory
containing the source files. Next run these commands:

```js
// Restore dependencies
yarn install

// Build source code for production
yarn run build:web
```

If everything worked as expected, you should have a new `build/` directory in
the project's folder. It should roughly resemble the following:

```bash
build
├── config/
├── static/
├── index.html
├── manifest.json
├── service-worker.js
└── ...
```

These files can be hosted using

### Configuration

...

- env vars
- `REACT_APP_*`
- config file(s)

## Next Steps

### Deploying our Production Build

TODO: List of recipes

### Automating Builds and Deployments

If you found setting up your environmnent and running all of these steps to be a
bit tedious, then you are in good company. Thankfully, there are a large number
of tools available to assist with automating tasks like building and deploying
web application. For a starting point, check out this repository's own use of:

- [CircleCI][circleci]: [config.yaml][circleci-config]
- [Netlify][netlify]: [netlify.toml][netlify.toml] |
  [generateStaticSite.sh][generatestaticsite.sh]
- [Semantic-Release][semantic-release]: [.releaserc][releaserc]

## Troubleshooting

> Issues and resolutions for common GitHub issues will be summarized here

...

<!-- prettier-ignore-start -->
[circleci]: https://circleci.com/gh/OHIF/Viewers
[circleci-config]: https://github.com/OHIF/Viewers/blob/react/.circleci/config.yml
[netlify]: https://app.netlify.com/sites/ohif/deploys
[netlify.toml]: https://github.com/OHIF/Viewers/blob/react/netlify.toml
[generateStaticSite.sh]: https://github.com/OHIF/Viewers/blob/react/generateStaticSite.sh
[semantic-release]: https://semantic-release.gitbook.io/semantic-release/
[releaserc]: https://github.com/OHIF/Viewers/blob/react/.releaserc
<!-- prettier-ignore-end -->

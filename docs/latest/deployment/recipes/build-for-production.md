# Build for Production

Note about setting up for contributing, then skip X

## Overview?

### Build Machine Requirements

- [Node.js & NPM](https://nodejs.org/en/download/)
- [Yarn](https://yarnpkg.com/lang/en/docs/install/)
- [Git](https://www.atlassian.com/git/tutorials/install-git)

### Get a Copy of the source

_With Git:_

```shell
# Clone the remote repository to your local machine
git clone https://github.com/OHIF/Viewers.git

# Make sure the local code reflects the `react` version of the OHIF Viewer
git checkout react
```

More on: _[`git clone`](https://git-scm.com/docs/git-clone),
[`git checkout`](https://git-scm.com/docs/git-checkout)_

_From .zip:_

[OHIF/Viewers: react.zip](https://github.com/OHIF/Viewers/archive/react.zip)

### Restore Dependencies?

...

### Configure?

...

- env vars
- `REACT_APP_*`
- config file(s)

### Build

From your projects

```js
yarn run build:web
```

```js
file tree of project, highlighting contents in `/buld`
```

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

<!-- prettier-ignore-start -->
[circleci]: https://circleci.com/gh/OHIF/Viewers
[circleci-config]: https://github.com/OHIF/Viewers/blob/react/.circleci/config.yml
[netlify]: https://app.netlify.com/sites/ohif/deploys
[netlify.toml]: https://github.com/OHIF/Viewers/blob/react/netlify.toml
[generateStaticSite.sh]: https://github.com/OHIF/Viewers/blob/react/generateStaticSite.sh
[semantic-release]: https://semantic-release.gitbook.io/semantic-release/
[releaserc]: https://github.com/OHIF/Viewers/blob/react/.releaserc
<!-- prettier-ignore-end -->

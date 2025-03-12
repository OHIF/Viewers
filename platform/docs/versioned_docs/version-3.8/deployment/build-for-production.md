---
sidebar_position: 2
---

# Build for Production

### Build Machine Requirements

- [Node.js & NPM](https://nodejs.org/en/download/)
- [Yarn](https://yarnpkg.com/lang/en/docs/install/)
- [Git](https://www.atlassian.com/git/tutorials/install-git)

### Getting the Code

_With Git:_

```bash
# Clone the remote repository to your local machine
git clone https://github.com/OHIF/Viewers.git
```

More on: _[`git clone`](https://git-scm.com/docs/git-clone),
[`git checkout`](https://git-scm.com/docs/git-checkout)_

_From .zip:_

[OHIF/Viewers: master.zip](https://github.com/OHIF/Viewers/archive/master.zip)

### Restore Dependencies & Build

Open your terminal, and navigate to the directory containing the source files.
Next run these commands:

```bash
# If you haven't already, enable yarn workspaces
yarn config set workspaces-experimental true

# Restore dependencies
yarn install

# Build source code for production
yarn run build
```

If everything worked as expected, you should have a new `dist/` directory in the
`platform/app/dist` folder. It should roughly resemble the following:

```bash title="<root>platform/app/dist/"
├── app-config.js
├── app.bundle.js
├── app.css
├── index.html
├── manifest.json
├── service-worker.js
└── ...
```

By default, the build output will connect to OHIF's publicly accessible PACS. If
this is your first time setting up the OHIF Viewer, it is recommended that you
test with these default settings. After testing, you can find instructions on
how to configure the project for your own imaging archive below.

### Configuration

The configuration for our viewer is in the `<root>platform/app/public/config`
directory. Our build process knows which configuration file to use based on the
`APP_CONFIG` environment variable. By default, its value is
[`config/default.js`][default-config]. The majority of the viewer's features,
and registered extension's features, are configured using this file.

The easiest way to apply your own configuration is to modify the `default.js`
file. For more advanced configuration options, check out our
[configuration essentials guide](../configuration/configurationFiles.md).

## Next Steps

### Deploying Build Output

_Drag-n-drop_

- [Netlify: Drop](./static-assets#netlify-drop)

_Easy_

- [Surge.sh](./static-assets#surgesh)
- [GitHub Pages](./static-assets#github-pages)

_Advanced_

- [AWS S3 + Cloudfront](./static-assets#aws-s3--cloudfront)
- [GCP + Cloudflare](./static-assets#gcp--cloudflare)
- [Azure](./static-assets#azure)

### Testing Build Output Locally

A quick way to test your build output locally is to spin up a small webserver.
You can do this by running the following commands in the `dist/` output
directory:

```bash
# Install http-server as a globally available package
yarn global add http-server

# Change the directory to the platform/app

# Serve the files in our current directory
npx serve ./dist -c ../public/serve.json
```

:::caution
In the video below notice that there is `platform/viewer` which has been renamed to `platform/app` in the latest version
:::

<div style={{padding:"56.25% 0 0 0", position:"relative"}}>
    <iframe src="https://player.vimeo.com/video/551957266?badge=0&amp;autopause=0&amp;player_id=0&amp;app_id=58479"  frameBorder="0" allow="autoplay; fullscreen; picture-in-picture" allowFullScreen style= {{ position:"absolute",top:0,left:0,width:"100%",height:"100%"}} title="measurement-report"></iframe>
</div>


### Automating Builds and Deployments

If you found setting up your environment and running all of these steps to be a
bit tedious, then you are in good company. Thankfully, there are a large number
of tools available to assist with automating tasks like building and deploying
web application. For a starting point, check out this repository's own use of:

- [CircleCI][circleci]: [config.yaml][circleci-config]
- [Netlify][netlify]: [netlify.toml][netlify.toml] |
  [build-deploy-preview.sh][build-deploy-preview.sh]

<!-- prettier-ignore-start -->
[circleci]: https://circleci.com/gh/OHIF/Viewers
[circleci-config]: https://github.com/OHIF/Viewers/blob/master/.circleci/config.yml
[netlify]: https://app.netlify.com/sites/ohif/deploys
[netlify.toml]: https://github.com/OHIF/Viewers/blob/master/platform/app/netlify.toml
[build-deploy-preview.sh]: https://github.com/OHIF/Viewers/blob/master/.netlify/build-deploy-preview.sh
<!-- prettier-ignore-end -->

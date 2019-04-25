# Viewers
This repo contains the OHIF DICOM Viewer and Lesion Tracker, and various shared meteor packages.

<div align="center">
  <a href="https://deploy-preview-398--ohif.netlify.com/"><strong>Read The Docs</strong></a> |
  <a href="https://github.com/OHIF/Viewers/tree/react/docs/latest">Edit the docs</a>
</div>


<hr />

[![CircleCI][circleci-image]][circleci-url]
[![codecov][codecov-image]][codecov-url]
[![All Contributors][all-contributors-image]][contributing-url]
[![code style: prettier][prettier-image]][prettier-url]
[![semantic-release][semantic-image]][semantic-url]

[![NPM version][npm-version-image]][npm-url]
[![NPM downloads][npm-downloads-image]][npm-url]
[![MIT License][license-image]][license-url]
<!-- markdownlint-enable -->
<!-- prettier-ignore-end -->

## Why?

Building a web based medical imaging viewer from scratch is time intensive, hard to get right, and expensive. Instead of re-inventing the wheel, you can use the OHIF Viewer as a rock solid platform to build on top of. The Viewer is a [React](https://reactjs.org/) [Progressive Web Application](https://developers.google.com/web/progressive-web-apps/) that can be embedded in existing applications via it's [packaged source (ohif-viewer)](https://www.npmjs.com/package/ohif-viewer) or hosted stand-alone. The Viewer exposes [configuration](https://deploy-preview-398--ohif.netlify.com/essentials/configuration.html) and [extensions](https://deploy-preview-398--ohif.netlify.com/advanced/extensions.html) to support workflow customization and advanced functionality at common integration points.

If you're interested in using the OHIF Viewer, but you're not sure it supports your use case [check out our docs](https://deploy-preview-398--ohif.netlify.com/). Still not sure, or you would like to propose new features? Don't hesitate to [create an issue](https://github.com/OHIF/Viewers/issues) or open a pull request ^_^

Documentation is available here: http://docs.ohif.org/
<!-- prettier-ignore-start -->
<!-- ROW -->
[all-contributors-image]: https://img.shields.io/badge/all_contributors-0-orange.svg?style=flat-square
[contributing-url]: https://github.com/OHIF/Viewers/blob/react/CONTRIBUTING.md
[circleci-image]: https://circleci.com/gh/OHIF/Viewers.svg?style=svg
[circleci-url]: https://circleci.com/gh/OHIF/Viewers
[codecov-image]: https://codecov.io/gh/OHIF/Viewers/branch/react/graph/badge.svg
[codecov-url]: https://codecov.io/gh/OHIF/Viewers
[prettier-image]: https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square
[prettier-url]: https://github.com/prettier/prettier
[semantic-image]: https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg
[semantic-url]: https://github.com/semantic-release/semantic-release
<!-- ROW -->
[npm-url]: https://npmjs.org/package/ohif-viewer
[npm-downloads-image]: https://img.shields.io/npm/dm/ohif-viewer.svg?style=flat-square
[npm-version-image]: https://img.shields.io/npm/v/ohif-viewer.svg?style=flat-square
[license-image]: https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square
[license-url]: LICENSE
<!-- DOCS -->

### Demos
[OHIF Viewer](http://viewer.ohif.org/) - A general-purpose radiology viewer with a variety of tools exposed.

[Lesion Tracker](http://lesiontracker.ohif.org/) - A prototype viewer focused on oncology metrics.

Community
---------

Have questions?  Try posting on our [google groups forum](https://groups.google.com/forum/#!forum/cornerstone-platform).

### Docker usage
Following the instructions below, the docker image will listen for DICOM connections on port 4242, and for web traffic on port 8042. The default username for the web interface is `orthanc`, and the password is `orthanc`.
#### Temporary data storage
````
docker run --rm -p 4242:4242 -p 8042:8042 jodogne/orthanc-plugins
````

#### Persistent data storage
1. Create a persistant data volume for Orthanc to use

    ````
    docker create --name sampledata -v /sampledata jodogne/orthanc-plugins
    ````
    
    **Note: On Windows, you need to use an absolute path for the data volume, like so:**
    
    ````
    docker create --name sampledata -v '//C/Users/erik/sampledata' jodogne/orthanc-plugins
    ````

2. Run Orthanc from Docker with the data volume attached

    ````
    docker run --volumes-from sampledata -p 4242:4242 -p 8042:8042 jodogne/orthanc-plugins
    ````

3. Upload your data and it will be persisted

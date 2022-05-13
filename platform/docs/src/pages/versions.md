# Versions

As we are increasing the efforts to make the OHIF platform more robust and up-to-date
with the latest software engineering practices, here we are listing the versions of
the OHIF platform that we are currently supporting, and the versions that have been
deprecated.

## Product Version vs Package Version

There are two types of versions that we need to consider here:

- Product Version: which is the end user visible version of the viewer
- Package Version: which is the underlying libraries/packages of the platform on npm.

Currently we have three product versions:

- Version 1 (deprecated): Built with Meteor as a full stack application.
- Version 2 (master branch): Front end image viewer built with React
- Version 3 (alpha release): Re-architected Version 2.0 to allow for a more modular and customizable viewer.

As per package versioning, we follow semantic versioning which looks like *a.b.c* where:

- *a* is for major breaking changes
- *b* is for new features
- *c* is for patches/bug fixes

You can read more semantic versioning [here](https://semver.org/).


## Maintained Product Versions

### Version 3.1 Cornerstone3D

OHIF Version 3.1 is the next major upcoming release of the OHIF platform. It uses
the next generation of the cornerstone library, [Cornerstone 3D](https://github.com/cornerstonejs/cornerstone3D-beta).
We are in the process of performing a parity check between this version and the `master`
branch before we merge it into the master branch. You can read more about the
roadmap timelines [here](https://ohif.org/roadmap/).

### Version 2.0: Master branch

Currently, the master branch of OHIF is on Product Version 2.0.

## Archived Versions

### Version 3.0 Cornerstone Legacy

Version 3.0 which uses [cornerstone-core](https://github.com/cornerstonejs/cornerstone) and
[cornerstone-tools](https://github.com/cornerstonejs/cornerstoneTools) for rendering and
manipulation/annotation of images.

### Version 1.0 Meteor

Deprecated in favor of Version 2.0. Built using full stack Meteor as a full stack application.

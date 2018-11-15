[![NPM version][npm-version-image]][npm-url] [![NPM downloads][npm-downloads-image]][npm-url] [![MIT License][license-image]][license-url] [![Build Status][travis-image]][travis-url]
[![Coverage Status][coverage-image]][coverage-url]

cornerstoneTools
================

`cornerstoneTools` is a library built on top of [cornerstone](https://github.com/cornerstonejs/cornerstone) that provides
a set of common tools needed in medical imaging to work with images and stacks of images.

* View [live examples](https://rawgithub.com/cornerstonejs/cornerstoneTools/master/examples/index.html) of individual tools
* Take a peek at a [simple image viewer](http://chafey.github.io/cornerstoneDemo/) built on cornerstone
* Check out a [more fully featured solution](http://viewer.ohif.org/) maintained by [OHIF](http://ohif.org/)


Features
--------

<!-- 5 columns looks great on desktop, but 4 column table supports mobile better -->
<table>
  <!-- Image Row -->
  <tr>
    <td>
      <img alt="WW/WC Tool Example" src="https://github.com/dannyrb/cornerstoneTools/raw/b5f1595d5ecbb021efcdb6640efc5d49751e3a08/examples/00-tool-images/wwwc.gif" />
    </td>
    <td>
      <img alt="Zoom Tool Example" src="https://github.com/dannyrb/cornerstoneTools/raw/e0a85b1dfad09cae76f47dc7629e3eb03c70135c/examples/00-tool-images/zoom.gif" />
    </td>
    <td>
      <img alt="Pan Tool Example" src="https://github.com/dannyrb/cornerstoneTools/raw/e0a85b1dfad09cae76f47dc7629e3eb03c70135c/examples/00-tool-images/pan.gif" />
    </td>
    <td>
      <img alt="Length Tool Example" src="https://github.com/dannyrb/cornerstoneTools/raw/e0a85b1dfad09cae76f47dc7629e3eb03c70135c/examples/00-tool-images/length.gif" />
    </td>
  <tr>
  <!-- Name Row -->
  <tr>
    <td>WW/WC</td>
    <td>Zoom</td>
    <td>Pan</td>
    <td>Length</td>
  </tr>
  <!-- External Links Row -->
  <tr>
    <td>
      <a href="https://rawgit.com/cornerstonejs/cornerstoneTools/master/examples/allImageTools/index.html">Example</a> /
      <a href="https://github.com/dannyrb/cornerstoneTools/blob/074c012323786744e45415f82a21582f65689923/src/imageTools/wwwc.js">Source</a>
    </td>
    <td>
      <a href="https://rawgit.com/cornerstonejs/cornerstoneTools/master/examples/allImageTools/index.html">Example</a> /
      <a href="https://github.com/cornerstonejs/cornerstoneTools/blob/master/src/imageTools/zoom.js">Source</a>
    </td>
    <td>
      <a href="https://github.com/cornerstonejs/cornerstoneTools/blob/master/src/imageTools/zoom.js">Example</a> /
      <a href="https://github.com/cornerstonejs/cornerstoneTools/blob/master/src/imageTools/pan.js">Source</a>
    </td>
    <td>
      <a href="https://rawgit.com/cornerstonejs/cornerstoneTools/master/examples/allImageTools/index.html">Example</a> /
      <a href="https://github.com/cornerstonejs/cornerstoneTools/blob/master/src/imageTools/length.js">Source</a>
    </td>
  </tr>
  <!-- Buffer Row -->
  <tr>
    <td colspan="4">&nbsp;</td>
  </tr>
   <!-- Image Row -->
  <tr>
    <td>
      <img alt="Rectangle ROI Tool Example" src="https://github.com/dannyrb/cornerstoneTools/raw/e0a85b1dfad09cae76f47dc7629e3eb03c70135c/examples/00-tool-images/rectangle-roi.gif" />
    </td>
    <td>
      <img alt="Elliptical ROI Tool Example" src="https://raw.githubusercontent.com/dannyrb/cornerstoneTools/3dc0bfc543b6b9a383d8724ce98859b568b9827e/examples/00-tool-images/elliptical-roi.gif" />
    </td>
    <td>
      <img alt="Pixel Probe Tool Example" src="https://raw.githubusercontent.com/dannyrb/cornerstoneTools/3dc0bfc543b6b9a383d8724ce98859b568b9827e/examples/00-tool-images/probe.gif" />
    </td>
    <td>
      <img alt="Angle Tool Example" src="https://raw.githubusercontent.com/dannyrb/cornerstoneTools/3dc0bfc543b6b9a383d8724ce98859b568b9827e/examples/00-tool-images/angle.gif" />
    </td>
  <tr>
  <!-- Name Row -->
  <tr>
    <td>Rectangle ROI</td>
    <td>Elliptical ROI</td>
    <td>Pixel Probe</td>
    <td>Angle</td>
  </tr>
  <!-- External Links Row -->
  <tr>
    <td>
      <a href="https://rawgit.com/cornerstonejs/cornerstoneTools/master/examples/allImageTools/index.html">Example</a> /
      <a href="https://github.com/cornerstonejs/cornerstoneTools/blob/master/src/imageTools/rectangleRoi.js">Source</a>
    </td>
    <td>
      <a href="https://rawgit.com/cornerstonejs/cornerstoneTools/master/examples/allImageTools/index.html">Example</a> /
      <a href="https://github.com/cornerstonejs/cornerstoneTools/blob/master/src/imageTools/ellipticalRoi.js">Source</a>
    </td>
    <td>
      <a href="https://rawgit.com/cornerstonejs/cornerstoneTools/master/examples/allImageTools/index.html">Example</a> /
      <a href="https://github.com/cornerstonejs/cornerstoneTools/blob/master/src/imageTools/probe.js">Source</a>
    </td>
    <td>
      <a href="https://rawgit.com/cornerstonejs/cornerstoneTools/master/examples/allImageTools/index.html">Example</a> /
      <a href="https://github.com/cornerstonejs/cornerstoneTools/blob/master/src/imageTools/angleTool.js">Source</a>
    </td>
  </tr>
  <!-- Buffer Row -->
  <tr>
    <td colspan="4">&nbsp;</td>
  </tr>
  <!-- Image Row -->
  <tr>
    <td>
      <img alt="Scroll Tool Example" src="https://raw.githubusercontent.com/dannyrb/cornerstoneTools/3dc0bfc543b6b9a383d8724ce98859b568b9827e/examples/00-tool-images/stack-scroll.gif" />
    </td>
    <td>
      <img alt="Cross reference lines Tool Example" src="https://raw.githubusercontent.com/dannyrb/cornerstoneTools/3dc0bfc543b6b9a383d8724ce98859b568b9827e/examples/00-tool-images/reference-lines.gif" />
    </td>
    <td colspan="2"><!-- Empty Column --></td>
  <tr>
  <!-- Name Row -->
  <tr>
    <td>Scroll</td>
    <td>Reference Lines</td>
    <td colspan="2">Many More!</td>
  </tr>
  <!-- External Links Row -->
  <tr>
    <td>
      <a href="https://rawgit.com/cornerstonejs/cornerstoneTools/master/examples/stackScroll/index.html">Example</a> /
      <a href="https://github.com/cornerstonejs/cornerstoneTools/blob/master/src/stackTools/stackScroll.js">Source</a>
    </td>
    <td>
      <a href="https://rawgit.com/cornerstonejs/cornerstoneTools/master/examples/referenceLineTool/index.html">Example</a> /
      <a href="https://github.com/cornerstonejs/cornerstoneTools/blob/master/src/referenceLines/referenceLinesTool.js">Source</a>
    </td>
    <td colspan="2"><a href="https://rawgit.com/cornerstonejs/cornerstoneTools/master/examples/index.html">Click Here to See a Full List</a></td>
  </tr>
</table>


**Other Features:**

* Time Series Tools
  * Play
  * Scroll
  * Probe
* Synchronization Tools
  * By image index
  * By image position
  * By zoom and pan
  * By ww/wc and inversion
* Measurement Manager
* Support for binding each tool to different mouse inputs:
  * Left mouse button
  * Middle mouse button
  * Right mouse button
  * Mouse Wheel
* Support for touch based gestures
  * Drag
  * Pinch
* Tool framework that can be used to simplify development of new tools that work in a consistent manner with the included
  tools
* Provides API to access measurement data for serialization purposes (e.g. save measurements to database)


Getting Started
---------------

### Install

**Via NPM:** (preferred)

_Latest stable release:_
- `npm install --save cornerstone-tools`

_Pre-release, unstable, mostly for contributors:_
- `npm install --save cornerstone-tools@next`

**Get a packaged source file:**

[UNPKG](https://unpkg.com/#/) offers a quick/neat solution for grabbing versioned copies of the source. For example:

`https://unpkg.com/<package-name>@<package-version>/path/to/desired-file.js`


* For development, to get the latest minified source:
    * `<script src="https://unpkg.com/cornerstone-tools"></script>`
* For production, specify a package version:
    * `<script src="https://unpkg.com/cornerstone-tools@0.9.0"></script>`


### Usage

See the [live examples](https://rawgithub.com/cornerstonejs/cornerstoneTools/master/examples/index.html) and [wiki](https://github.com/cornerstonejs/cornerstoneTools/wiki) for documentation (Soon to be replaced by [tools.cornerstonejs.org](http://tools.cornerstonejs.org/)) on how to use this library


**A common setup when using modules:**

````javascript
// Load NPM packages
import Hammer from 'hammerjs';                    // npm install --save hammerjs
import * as cornerstone from 'cornerstone-core';  // npm install --save cornerstone-core
import * as cornerstoneTools from 'cornerstone-tools';

// Specify external dependencies
cornerstoneTools.external.cornerstone = cornerstone;
cornerstoneTools.external.Hammer = Hammer;
````

*Note: `cornerstoneTools.external`'s only need to be specified in `cornerstone-tools` versions 1.0.0+


**A common setup when using package source files:**

````javascript
// Load Packaged Sources
<script src="https://unpkg.com/hammerjs@2.0.8/hammer.js"></script>
<script src="https://unpkg.com/cornerstone-core@2.0.0/dist/cornerstone.min.js"></script>
<script src="https://unpkg.com/cornerstone-tools@2.0.0/dist/cornerstoneTools.min.js"></script>

// Specify external dependencies
cornerstoneTools.external.cornerstone = cornerstone;
cornerstoneTools.external.Hammer = Hammer;
````

*Note: `cornerstoneTools.external`'s only need to be specified in `cornerstone-tools` versions 1.0.0+


Contributing
------------

We love contributions, and we have plenty of work queued up for all skill levels. If you have an idea, feel free to create a new topic on [our community discussion board](https://groups.google.com/forum/#!forum/cornerstone-platform), or comment on an existing [enhancement](https://github.com/cornerstonejs/cornerstoneTools/issues?q=is%3Aissue+is%3Aopen+label%3Aenhancement), [up-for-grabs](https://github.com/cornerstonejs/cornerstoneTools/issues?q=is%3Aissue+is%3Aopen+label%3A%22up+for+grabs%22), [bug](https://github.com/cornerstonejs/cornerstoneTools/issues?q=is%3Aissue+is%3Aopen+label%3Abug), [documentation](https://github.com/cornerstonejs/cornerstoneTools/labels/documentation) issue. A quick "here is how I intend to approach this problem", with sign-off from someone like @swederik, will go a long way toward increasing the chances your hard work will be merged :+1:

**How To Contribute:**

1. Fork this repository
2. Clone the forked repository
3. Before committing code, create a branch-per-feature, or branch-per-bug
4. Create pull requests against `cornerstonejs/cornerstoneTools/master`

**What To Contribute:**

If you're looking to get your feet wet, start by:

- Read existing [wiki documentation](https://github.com/cornerstonejs/cornerstoneTools/wiki) as you implement your solution. Notice any holes? Fill them in.
  - Soon to be replaced by [tools.cornerstonejs.org](http://tools.cornerstonejs.org/)
- Can't find an [example of a tool](https://rawgit.com/cornerstonejs/cornerstoneTools/master/examples/index.html)? Or think an example can be improved? Improve it.
- Creating your first tool and learned some lessons along the way? Add documentation to help others.

Can't think of anything? Weigh in on and claim an [outstanding issue in the backlog](https://github.com/cornerstonejs/cornerstoneTools/issues).


Versioning
----------

cornerstoneTools will be maintained under the [Semantic Versioning Guidelines](http://semver.org) as much as possible. Releases will be numbered with the following format:

`<major>.<minor>.<patch>`

And constructed with the following guidelines:

* Breaking backward compatibility bumps the major (and resets the minor and patch)
  - Information on how to navigate breaking changes will be included in our [Change Log](https://github.com/cornerstonejs/cornerstoneTools/blob/master/changelog.md)
* New additions, including new icons, without breaking backward compatibility bumps the minor (and resets the patch)
* Bug fixes, changes to brand logos, and misc changes bumps the patch


Build System
------------

This project uses webpack to build the software.

**Requirements:**

* [NodeJs](http://nodejs.org).

**Common Tasks:**


Update dependencies (after each pull):
> npm install

Running the build:
> npm start

Automatically running the build and unit tests after each source change:
> npm run watch

Backlog
------------

* Updating related handles while resizing (e.g. resize top left handle of a rect and update the bottom left and top right as it changes)
* measurement calibration tool
* Config object that allows tool appearance to be customized (e.g. line color, text color, handle size, shape, etc)
* automatically disabling tools when the enabled element is disabled
* reconsider the state management api, it is a bit clunky
* add support for pointer events as an input source
* Reference line renderer for first/last/active
* key press input source - so user can interact with tools via keyboard (e.g. scroll stack image using arrow keys)


[license-image]: http://img.shields.io/badge/license-MIT-blue.svg?style=flat
[license-url]: LICENSE

[npm-url]: https://npmjs.org/package/cornerstone-tools
[npm-version-image]: http://img.shields.io/npm/v/cornerstone-tools.svg?style=flat
[npm-downloads-image]: http://img.shields.io/npm/dm/cornerstone-tools.svg?style=flat

[travis-url]: http://travis-ci.org/cornerstonejs/cornerstoneTools
[travis-image]: https://travis-ci.org/cornerstonejs/cornerstoneTools.svg?branch=master

[coverage-url]: https://coveralls.io/github/cornerstonejs/cornerstoneTools?branch=master
[coverage-image]: https://coveralls.io/repos/github/cornerstonejs/cornerstoneTools/badge.svg?branch=master

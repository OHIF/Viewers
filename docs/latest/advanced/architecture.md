# Architecture

## Overview

The [`OHIF/Viewers`](https://github.com/OHIF/Viewers/tree/react) repository contains the source code for the OHIF Medical Imaging Viewer. It is effectively a React [progressive web app](https://developers.google.com/web/progressive-web-apps/) (PWA) that combines the business logic housed in [`OHIF/ohif-core`](https://github.com/OHIF/ohif-core) and the components in our React Component library [`OHIF/react-viewerbase`](https://github.com/OHIF/react-viewerbase). It provides customization for common use cases through [configuration](../essentials/configuration.md) and for adding functionality via [extensions](./extensions.md).

The purpose of this documentation is to better illustrate how these pieces work together to create a Viewer and where you should direct your attention for contributions.

### Business Logic

Our goal is to maintain the majority of our business logic in [`OHIF/ohif-core`](https://github.com/OHIF/ohif-core). `ohif-core` offers pre-packaged solutions for features common to Web-based medical imaging viewers. For example:

- Hotkeys
- DICOM Web
- Hanging Protocols
- Managing a study's measurements
- Managing a study's DICOM metadata
- A flexible pattern for extensions
- [And many others](https://github.com/OHIF/ohif-core/blob/master/src/index.js#L49-L69)

It does this while remaining decoupled from any particular view library or
rendering logic. While we use it to power our React Viewer, it can be used with Vue, React, Vanilla JS, or any number of other frameworks.

### Misc. Extensions

Want to add custom logic or UI Components to the OHIF Viewer, but don't want to maintain a fork? We expose common integration points via [extensions](./extensions.md) to make that possible. For a list of extensions maintained by OHIF, [check out this helpful table](./extensions.html#ohif-maintained-extensions).


If you find yourself thinking "I wish the Viewer could do X", and you can't accomplish it with an extension today, create a GitHub issue! We're actively looking for ways to improve our extensibility ^_^

[Click here to read more about extensions!](./extensions.md)
![Architecture Diagram](../assets/img/architecture-diagram.png)

<center><i>architecture diagram</i></center>

## Common Questions

> Can I create my own Viewer using Vue.js or Angular.js?

You can, but you will not be able to leverage as much of the existing code and components. `ohif-core` could still be used for business logic, and to provide a model for extensions. `react-viewerbase` would then become a guide for the components you would need to recreate.
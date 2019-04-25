# Architecture

## Overview

The [`OHIF/Viewers`](https://github.com/OHIF/Viewers/tree/react) repository contains the source code for the OHIF Medical Imaging Viewer. It is effectively a React [progressive web app](https://developers.google.com/web/progressive-web-apps/) (PWA) that combines the business logic housed in [`OHIF/ohif-core`](https://github.com/OHIF/ohif-core) and the components in our React Component library [`OHIF/react-viewerbase`](https://github.com/OHIF/react-viewerbase). It provides customization for common use cases through [configuration](../essentials/configuration.md) and for adding functionality via [extensions](./extensions.md).

The purpose of this documentation is to better illustrate how these pieces work together to create a Viewer and where you should direct your attention for contributions.
![Architecture Diagram](../assets/img/architecture-diagram.png)

<center><i>architecture diagram</i></center>
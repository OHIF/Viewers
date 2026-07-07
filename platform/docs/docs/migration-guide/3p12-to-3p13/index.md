---
id: index
sidebar_position: 1
sidebar_label: 3.12 -> 3.13
title: 3.12 to 3.13 Migration Guide
---

import DocCardList from '@theme/DocCardList';

# 3.12 to 3.13 Migration Guide

This guide covers changes when upgrading from OHIF version 3.12 to version 3.13.

The largest changes in 3.13 are infrastructure-level:

- **[Package Manager](./package-manager.md)** — the monorepo moves from
  yarn + lerna to **pnpm workspaces**, with new install/run commands
  and a `workspace:*` syntax for cross-package dependencies.
- **[Build Tooling](./build-tooling.md)** — Webpack is replaced with
  **Rspack v2** across the app and every extension/mode, with new
  plugin imports and faster build commands.
- **[Node Version](./node-version.md)** — the minimum Node.js runtime
  is now **24**.
- **[SegmentationService](./segmentation-service.md)** — the
  `removeSegmentationRepresentations` method was renamed.
- **[DICOM video viewport](./dicom-video.md)** — the
  `@ohif/extension-dicom-video.viewportModule.dicom-video` namespace was
  removed; route DICOM video display sets through the Cornerstone viewport.

<DocCardList />

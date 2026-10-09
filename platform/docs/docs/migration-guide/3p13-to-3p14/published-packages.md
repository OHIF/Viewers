---
sidebar_position: 13
sidebar_label: Published packages
title: Fewer packages published to npm
---

# Fewer packages published to npm

Starting with 3.14, OHIF publishes a smaller set of packages to npm. The other
extensions and modes still ship inside the viewer, built from the monorepo, but
they no longer get npm releases.

If you deploy the viewer from this repository, nothing changes. This matters only
if your project installs OHIF packages from npm.

## Still published

| Package | What it is |
| --- | --- |
| `@ohif/core` | Services, managers and utilities |
| `@ohif/ui-next` | The UI component library |
| `@ohif/i18n` | Translations |
| `@ohif/extension-default` | The default extension |
| `@ohif/extension-cornerstone` | The Cornerstone rendering extension |
| `create-ohif` | The tool that creates OHIF extensions, modes and workspaces (`pnpm create ohif@beta`). See [Create an Extension or Mode](../../development/create-ohif.md). |
| `@ohif/app` | The viewer application. Still published in 3.14; whether it stays published is not yet decided. |

The five SDK packages are the ones a third-party extension or mode builds
against, and the ones the viewer shares with runtime plugins.

## No longer published

Every other package in the monorepo is now `private: true`:

- The other extensions: `@ohif/extension-cornerstone-dicom-seg`,
  `-dicom-sr`, `-dicom-rt`, `-dicom-pmap`, `-dynamic-volume`,
  `@ohif/extension-dicom-pdf`, `-dicom-video`, `-dicom-microscopy`,
  `@ohif/extension-measurement-tracking`, `@ohif/extension-tmtv`,
  `@ohif/extension-ultrasound-pleura-bline` and `@ohif/extension-test`.
- Every mode: `@ohif/mode-longitudinal`, `@ohif/mode-segmentation`,
  `@ohif/mode-tmtv`, `@ohif/mode-microscopy`, `@ohif/mode-preclinical-4d`,
  `@ohif/mode-ultrasound-pleura-bline`, `@ohif/mode-basic`,
  `@ohif/mode-basic-dev-mode` and `@ohif/mode-test`.
- The legacy UI library, `@ohif/ui`.

Versions already on npm stay there. The last stable release of each is 3.13.x,
and there are no stable 3.14 releases of them.

## What to do

If your project depends on one of the packages that are no longer published:

1. **You build your own viewer that includes it.** Build from the OHIF monorepo
   (a fork, or a checkout with your plugins added through
   [`create-ohif --in-tree`](../../development/create-ohif.md#scaffold-into-a-checkout-in-tree)),
   or use a [`create-ohif` workspace](../../development/create-ohif.md#workspace-recommended),
   which builds the viewer from a pinned copy of OHIF and includes every
   extension and mode.
2. **Your extension or mode uses it.** Remove peer dependencies on the
   unpublished packages; a peer with no 3.14 release can make your install fail.
   Most uses need no package at all:
   - Module IDs such as
     `'@ohif/extension-cornerstone-dicom-seg.viewportModule.dicom-seg'`, and the
     extensions a mode lists, are resolved by the running viewer from the
     extensions it has loaded.
   - For code an extension registers, ask the viewer for it instead of importing
     the package. For example, instead of
     `import { toolNames } from '@ohif/extension-cornerstone-dicom-sr'`:

     ```js
     const { toolNames } = extensionManager.getModuleEntry(
       '@ohif/extension-cornerstone-dicom-sr.utilityModule.tools'
     ).exports;
     ```

     Commands work the same way through `commandsManager.runCommand`.
   - Plain constants, such as tool group IDs, can be copied into your package.

   If you need code that an extension does not register, build your plugin inside
   an OHIF checkout (`--in-tree`) or a `create-ohif` workspace, where every
   extension is available from source.
3. **You import from `@ohif/ui`.** Move those imports to `@ohif/ui-next`. See
   [WorkList](./work-list.md#related-ohifui-is-frozen).
4. **You need more time for one of these changes.** For example, an extension
   built on many `@ohif/ui` components can take a while to port, because the
   `@ohif/ui-next` APIs differ. Stay on 3.13.x until the change is done; its
   packages remain on npm.

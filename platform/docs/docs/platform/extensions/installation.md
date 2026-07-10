---
sidebar_position: 5
sidebar_label: Installation
title: Extension Installation
summary: How to install external OHIF extensions by declaring them in pluginConfig.json — from npm, from an out-of-tree checkout, or in-tree.
---

# Extension: Installation

Extensions are declared in
[`platform/app/pluginConfig.json`](./pluginConfig.md) and compiled into the
viewer at build time.

- **From npm** — install to the workspace root, then declare the package:

  ```bash
  pnpm add -w @acme/extension-foo
  ```

  ```jsonc title="platform/app/pluginConfig.json"
  { "extensions": [ { "packageName": "@acme/extension-foo" } ] }
  ```

- **From a local checkout** — add a `directory` entry; see
  [Plugin locations](./pluginConfig.md#plugin-locations).
- **In-tree** — place the package under `extensions/` and declare it by
  `packageName` (the workspace glob already covers it).

:::warning Deprecated
The former [OHIF CLI](../../development/ohif-cli.md) (`add-extension`,
`link-extension`, …) is deprecated and scheduled for removal; its `link`
commands no longer work under pnpm.
:::

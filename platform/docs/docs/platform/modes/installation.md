---
sidebar_position: 5
sidebar_label: Installation
title: Mode Installation
summary: How to install external OHIF modes by declaring them in pluginConfig.json — from npm, from an out-of-tree checkout, or in-tree.
---

# Modes: Installation

Modes are declared in
[`platform/app/pluginConfig.json`](../extensions/pluginConfig.md) and compiled
into the viewer at build time.

- **From npm** — install to the workspace root, then declare the package:

  ```bash
  pnpm add -w @acme/mode-bar
  ```

  ```jsonc title="platform/app/pluginConfig.json"
  { "modes": [ { "packageName": "@acme/mode-bar" } ] }
  ```

- **From a local checkout** — add a `directory` entry; see
  [Plugin locations](../extensions/pluginConfig.md#plugin-locations).
- **In-tree** — place the package under `modes/` and declare it by
  `packageName` (the workspace glob already covers it).

Also declare the extensions the mode lists in its `peerDependencies` — the
build does not add them automatically.

:::warning Deprecated
The former [OHIF CLI](../../development/ohif-cli.md) (`add-mode`,
`link-mode`, …) is deprecated and scheduled for removal; its `link`
commands no longer work under pnpm.
:::

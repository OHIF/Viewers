---
sidebar_position: 5
sidebar_label: Installation
title: Mode Installation
summary: How to install external OHIF modes by declaring them in pluginConfig.json — from npm, from an out-of-tree checkout, or in-tree — with the pnpm run plugin helper.
---

# Modes: Installation

Every installed mode is an entry in
[`platform/app/pluginConfig.json`](../extensions/pluginConfig.md) and is
compiled into the viewer at build time.

## From npm

```bash
pnpm add -w @acme/mode-bar
```

```jsonc title="platform/app/pluginConfig.json"
{ "modes": [ { "packageName": "@acme/mode-bar" } ] }
```

Or do both in one step with the helper:

```bash
pnpm run plugin add @acme/mode-bar
```

## Declare the mode's extensions

The extensions a mode lists in its `peerDependencies` must also be installed
and declared in the `extensions` array — the build does not add them
automatically. `pnpm run plugin doctor` flags missing ones.

---

The procedure is otherwise identical to
[extension installation](../extensions/installation.md): the same
`pnpm run plugin` commands (`add`, `remove`, `link`, `unlink`, `list`,
`doctor`) apply, and out-of-tree and in-tree placement work the same way.

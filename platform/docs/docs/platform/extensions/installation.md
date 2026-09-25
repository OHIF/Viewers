---
sidebar_position: 5
sidebar_label: Installation
title: Extension Installation
summary: How to install external OHIF extensions by declaring them in pluginConfig.json — from npm, from an out-of-tree checkout, or in-tree — with the pnpm run plugin helper.
---

# Extension: Installation

Every installed extension is an entry in
[`platform/app/pluginConfig.json`](./pluginConfig.md) and is compiled into the
viewer at build time. There are three placement options, mirroring
[Plugin locations](./pluginConfig.md#plugin-locations): install from npm, point
at an out-of-tree checkout, or keep the package in-tree.

## From npm

Install the package at the workspace root, then declare it:

```bash
pnpm add -w @acme/extension-foo
```

```jsonc title="platform/app/pluginConfig.json"
{ "extensions": [ { "packageName": "@acme/extension-foo" } ] }
```

Or do both in one step with the helper:

```bash
pnpm run plugin add @acme/extension-foo
```

## From a local checkout (out-of-tree)

Point the config at a checkout on disk:

```bash
pnpm run plugin link ../extension-foo
```

This adds a `directory` entry to `pluginConfig.json`. See
[Develop Out-of-Tree](../../development/out-of-tree.md) for the full workflow.
The manual equivalent is:

```jsonc title="platform/app/pluginConfig.json"
{ "extensions": [ { "packageName": "@acme/extension-foo", "directory": "~/dev/extension-foo" } ] }
```

## In-tree

Copy or scaffold the package under `extensions/` and declare it by
`packageName` — the workspace glob already covers that directory:

```bash
pnpm create ohif@beta --in-tree
```

See [Create an Extension or Mode](../../development/create-ohif.md).

## Check your setup

```bash
pnpm run plugin list
pnpm run plugin doctor
```

`doctor` validates the `pluginConfig.json` schema, checks that every declared
package resolves, verifies `@ohif/core` peer-range compatibility (prerelease
versions included), and reports installed-but-undeclared packages that carry
the `ohif-extension` or `ohif-mode` keyword. For each one it prints the exact
JSON line to paste into `pluginConfig.json`; it never writes the file itself.

## Removing

```bash
pnpm run plugin remove @acme/extension-foo
```

## Install at runtime (no rebuild)

Extensions can also be loaded into a running viewer without a rebuild. See
[Runtime Extensions](./runtime-extensions.md).

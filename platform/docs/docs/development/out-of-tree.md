---
sidebar_position: 3.1
sidebar_label: Develop Out-of-Tree
title: Develop an Extension Out-of-Tree
summary: How to develop OHIF extensions and modes in a checkout outside the Viewers repository using a pluginConfig.json directory entry, with dedicated sections on dependency singletons, Tailwind styling, HMR, and troubleshooting.
---

# Develop an Extension Out-of-Tree

You do not have to copy your extension or mode into the OHIF Viewers
repository to develop against it. A pluginConfig.json entry with a `directory`
field points the build at a checkout anywhere on disk, so you can keep your
plugin in its own repository, edit it in place, and get full hot-reload against
a locally running viewer. This is the recommended path for building a product
on top of OHIF.

## Choosing a workflow

There is more than one way to combine your code with the viewer. Pick by what
you are trying to do:

| Workflow | When to use it | How you declare it |
| --- | --- | --- |
| **In-tree workspace** | You are contributing the plugin back to OHIF itself. | A package under `extensions/` or `modes/`; declare it by `packageName`. |
| **`directory` checkout** | Local product development against your own repo (this page). | A pluginConfig.json entry with a `directory` field pointing at the checkout. |
| **Installed npm package** | You want pinned, versioned dependencies (a released plugin). | `pnpm add -w @my-org/my-extension`, then declare it by `packageName`. See [Publish an Extension or Mode](./publishing.md). |
| **Runtime descriptor** | Load a prebuilt UMD bundle at runtime with no viewer rebuild. | A descriptor in `app-config.js`. See [Runtime Extensions](../platform/extensions/runtime-extensions.md). |

The rest of this page covers the `directory` checkout workflow.

## Declare a directory plugin

Add your checkout to `platform/app/pluginConfig.json` with a `directory` field:

```json
{
  "extensions": [
    { "packageName": "@my-org/my-extension", "directory": "~/ohif-plugins/my-extension" }
  ],
  "modes": [
    { "packageName": "@my-org/my-mode", "directory": "./external/my-mode" }
  ]
}
```

Path forms accepted in `directory`:

- `~/...` — relative to your home directory.
- `./...` — relative to the **repo root** of this Viewers checkout (not to the
  location of `pluginConfig.json`).
- anything else — treated as an absolute path.

Always use forward slashes, even on Windows.

:::caution The `~` is expanded by OHIF, not your shell
OHIF expands a leading `~` internally (via `os.homedir()`), so it works inside
the JSON file where a shell would never see it. Two consequences: the tilde
must be the **first character** of the string (`~/dev/foo`, never
`/Users/me/~/foo`), and shell-style variants such as `$HOME` or `~otheruser`
are **not** expanded. When in doubt, use an absolute forward-slash path.
:::

Two rules make the entry resolve:

- **`packageName` MUST equal the `name` in your plugin's `package.json` AND the
  extension/mode `id`.** The build's resolve alias and the runtime module
  registry both key on this exact string; a mismatch resolves to nothing.
- **`directory` points at the package ROOT** — the folder that contains
  `package.json`. Its `src/`, `public/`, and `dist/` subfolders are discovered
  from there.

You can also add the entry with the plugin helper instead of editing the file
by hand — see [Register with the helper](#register-with-the-helper) below.

## Declare an installed (npm) plugin

If your plugin is published, install it into the workspace root and declare it
by `packageName` with no `directory`:

```json
{ "extensions": [{ "packageName": "@my-org/my-extension" }] }
```

```bash
pnpm add @my-org/my-extension -w
```

An installed plugin resolves from `node_modules` through the normal walk-up and
deliberately gets **no resolve alias** — it behaves like any other installed
dependency, and its `public/`/`dist/` assets are copied from the installed
location.

## How your imports resolve

A fixed list of packages is force-resolved to the host's single copy through
dedupe aliases, no matter what your plugin folder carries:

- `react`
- `react-dom`
- `react/jsx-runtime`
- `@ohif/core`
- `@ohif/ui-next`
- `@cornerstonejs/core`
- `@cornerstonejs/tools`

These aliases are exact-match (a trailing `$` on the specifier), so bare imports
snap to the host copy while **deep subpath imports** (for example
`@ohif/ui-next/lib/...`) still flow through normal resolution and honor each
package's `exports` map.

Consequences for your plugin:

- **Do not install `react`, `react-dom`, `@ohif/*`, or `@cornerstonejs/*` into
  your plugin folder.** Declare them as `peerDependencies` instead.
- Keep `auto-install-peers=false` in your plugin's `.npmrc` (the scaffolder
  template ships this) so a `pnpm install` inside your plugin does not silently
  pull a second copy of a singleton in as a peer.

:::note One gap the exact-match aliases do not close
The alias covers the bare `react-dom` specifier but not the `react-dom/client`
subpath. A plugin-local `react-dom` imported through `react-dom/client` can
still duplicate React and produce an "Invalid hook call". The same residual
applies to packages outside the settled list, such as
`@cornerstonejs/dicom-image-loader` and `@ohif/ui`. `pnpm plugin doctor`
(below) warns when your checkout's `node_modules` carries any host-singleton
package.
:::

## Styling with Tailwind

The viewer's Tailwind build adds a content glob for each declared `directory`
plugin, of the form:

```
<directory>/src/**/*.{jsx,js,ts,tsx,css}
```

So your Tailwind classes must live under `<directory>/src/`. Files elsewhere in
your checkout are not scanned and their classes will not be emitted. Arbitrary
values (for example `text-[13.7px]`) work.

If your plugin also ships standalone, runtime-compiled CSS (a Tailwind build of
its own, outside the host), set `corePlugins: { preflight: false }` in that
config so it does not re-emit the global base layer the host already provides,
and only set a `prefix` if you are intentionally diverging from the ui-next
preset theme (whose colors flow through `hsl(var(--...))` custom properties that
the host defines once).

## Dev loop

Both dev pipelines watch external directories and support fast refresh:

- `pnpm dev` — the Rspack pipeline.
- `pnpm dev:fast` — the Rsbuild pipeline.

Edit files in your checkout and the running viewer hot-reloads them, exactly as
if they were in-tree.

:::caution HMR skips anything under a `node_modules` segment
The dev transpile/babel rules exclude every file whose path contains a
`node_modules` segment. If your plugin checkout lives **under** a `node_modules`
folder, it will neither transpile nor fast-refresh. Keep the checkout outside
any `node_modules` directory.
:::

## Register with the helper

Instead of editing `pluginConfig.json` by hand you can use the bundled plugin
helper, which writes the same `directory` entry (as a repo-root-relative `./`
path when the checkout is inside the repo, otherwise absolute) and then runs a
health check:

```bash
pnpm plugin link ../my-extension
pnpm plugin unlink @my-org/my-extension
```

`pnpm plugin doctor` re-runs the health check on demand: it verifies each
declared plugin's `@ohif/core` peer range against the host and warns about the
plugin-local singleton copies described above.

## Verify your setup

A quick three-step check that the wiring is correct:

1. **Tailwind reaches your `src/`** — add a throwaway `text-[13.7px]` utility to
   a component under `<directory>/src/` and confirm it renders at that size. If
   it does not, the class is outside the scanned `src/` tree or the `directory`
   path is wrong.
2. **Only one React** — grep the built output for a second React coming from
   your plugin folder (for example a path matching `ohif-plugins.*node_modules.react`).
   A match means a plugin-local React is leaking past the dedupe alias.
3. **No "Invalid hook call"** — this runtime error is the symptom of the
   duplicate-React case above.

## Troubleshooting

- **"Invalid hook call"** — your plugin folder carries its own `react`/`react-dom`
  copy (often via `react-dom/client`). Remove the local install and declare
  React as a `peerDependency`; keep `.npmrc` `auto-install-peers=false`.
- **Components render unstyled** — your class-bearing files are not under the
  declared `<directory>/src/`, or the `directory` path has a typo. Fix the path
  or move the files under `src/`.
- **"Module not found" on a deep subpath** — the import does not match the target
  package's `exports` map (or the package is not on the resolver's search path).
  Import a path the package actually exports.
- **`pnpm install` in your plugin fails on a `workspace:` version, or consumers
  can't resolve your deps** — you copied a `package.json` from an in-tree OHIF
  extension, whose `@ohif/*` dependencies use `workspace:*`. The `workspace:`
  protocol is only valid inside the OHIF monorepo. Replace those with real
  semver ranges under `peerDependencies` (`"@ohif/core": ">=3.13.0-beta.0 <4"`).
  The scaffolder templates already do this.
- **Asset copy warnings (robocopy on Windows)** — robocopy exit codes 0-7 are
  success, not failure.

## Next steps

- [Create an Extension or Mode](./create-ohif.md) — scaffold a new plugin with
  the correct shape from the start.
- [Publish an Extension or Mode](./publishing.md) — turn your checkout into a
  released npm package.
- [Runtime Extensions](../platform/extensions/runtime-extensions.md) — load a
  prebuilt bundle at runtime with no viewer rebuild.
- [pluginConfig.json reference — Plugin locations](../platform/extensions/pluginConfig.md#plugin-locations)
  — the normative reference for the `directory` field.

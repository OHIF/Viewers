---
sidebar_position: 3
sidebar_label: Create an Extension or Mode
title: Create an Extension or Mode
summary: Scaffold OHIF workspaces, extensions, modes, and deployment configs with the published create-ohif tool — the workspace-first replacement for the removed OHIF CLI's create-extension/create-mode commands.
---

# Create an Extension or Mode

:::note
`pnpm create ohif` downloads and runs the npm package `create-ohif` (pnpm adds
the `create-` prefix).
:::

`create-ohif` is a published scaffolder that replaces the removed OHIF CLI's
`create-extension` / `create-mode` commands. It generates a ready-to-build
package (or a whole workspace) that already matches the plugin contract: the
`.rspack/` UMD build config, the correct `package.json` shape, pnpm settings
that keep the host-provided peers from being installed, and an `AGENTS.md`
contract summary.

## Quick start

```bash
pnpm create ohif
```

The first prompt is **"What are you building?"** with four templates:

| Template | What it scaffolds |
| --- | --- |
| **Workspace** (default) | Your own git repo of extensions/modes plus config, backed by a managed OHIF harness. Recommended for teams. |
| **Extension** | A single OHIF extension package. |
| **Mode** | A single OHIF mode (workflow) package. |
| **Deployment** | Config only: `app-config.js` + `docker-compose.yml`, no code. |

You are then asked for a **package name** (for an extension this becomes the
extension `id` — they MUST match; `create-ohif` derives the `id` from the
package name so the contract holds by construction), and a **description**. For
an extension you also pick which **module types** it should provide (viewport,
panel, commands, sopClassHandler, toolbar, hangingProtocol) — unselected
modules leave neither files nor references behind.

## Workspace (recommended)

The workspace template scaffolds one folder that becomes your own git repo:

```
my-ohif-workspace/
├── ohif.config.json       # the committed manifest: pinned OHIF version, plugins, appConfig
├── config/app-config.js   # your viewer configuration
├── extensions/            # your extension packages
├── modes/                 # your mode packages
├── scripts/ohif.mjs       # harness manager (dev / build / doctor / plugin / harness)
├── Dockerfile             # nginx + built dist + APP_CONFIG entrypoint
├── package.json           # private; dev/build/doctor/plugin scripts
└── .gitignore             # ignores the machine-managed .ohif/ harness
```

`ohif.config.json` is authoritative — it pins the OHIF version and lists the
plugins the workspace owns. The `.ohif/` directory is a machine-managed,
gitignored, disposable shallow checkout of the pinned OHIF tag; nothing
user-owned lives inside it, and it can be deleted and recreated at any time.

```bash
cd my-ohif-workspace
pnpm install
pnpm dev
```

`pnpm dev` runs `harness ensure` (shallow-clone the pinned tag into `.ohif/`,
install, link every manifest plugin, and sync your `config/app-config.js`) and
then starts the harness dev server with your workspace plugins source-compiled
under HMR. `pnpm run harness upgrade <tag>` re-pins the manifest, re-clones, and
re-links.

Running `pnpm create ohif` **inside** a workspace folder scaffolds the new
extension or mode into `extensions/` or `modes/`, appends it to
`ohif.config.json`, and links it into the harness on the next `pnpm dev` — no
manual wiring.

## Extension and mode layout

A standalone extension scaffold:

```
extension-foo/
├── pnpm-workspace.yaml    # autoInstallPeers: false (prevents a second React)
├── .npmrc                 # the same setting for pnpm older than 12
├── .prettierrc  .gitignore
├── package.json  tsconfig.json  README.md  AGENTS.md
├── tailwind.config.js     # self-contained CSS; Tailwind preflight off
├── .rspack/
│   ├── rspack.prod.js      # UMD build; host-provided packages are externals
│   └── pluginExternals.js  # the externals list (mirrors the monorepo's)
├── public/                # static assets copied into the app build
└── src/
    ├── index.tsx          # default export: { id, get*Module… }
    ├── id.ts              # id = package.json name — never hardcode it
    ├── styles.css
    └── getViewportModule.tsx, viewports/…   # one pair per selected module
```

A mode scaffold is the same shape without `public/`, `tailwind.config.js`, or
`styles.css`, and its entry is `src/index.ts`.

Build and preview a standalone package:

```bash
cd extension-foo
pnpm install
pnpm build
```

## Scaffold into a checkout (in-tree)

To develop inside a clone of the OHIF Viewers monorepo, run the checkout's own
copy from its root:

```bash
node platform/create-ohif/bin/create-ohif.mjs my-extension --template extension --in-tree
```

Use this rather than `pnpm create ohif`: it matches the checkout's version, and
the repo's `pnpm-workspace.yaml` sets a two-day `minimumReleaseAge`, so pnpm
refuses a `create-ohif` version published less than two days ago.

This writes into `extensions/` or `modes/` of the enclosing checkout (detected
by walking up to a directory that has both `pnpm-workspace.yaml` and
`platform/app/pluginConfig.json`). The `extensions/*` / `modes/*` workspace
globs pick it up automatically, but you still declare it in
`platform/app/pluginConfig.json`. Add the printed entry by hand, or in one step:

```bash
pnpm run plugin add @acme/extension-foo
pnpm run install:update-lockfile
```

In-tree scaffolds use `workspace:*` peer ranges and minimal devDependencies —
the monorepo's hoisted toolchain resolves the rest. They are marked
`private: true` and take the checkout's version, like every other app-only
package in the repo, and they carry no `.npmrc` or `pnpm-workspace.yaml` of their
own: the repo root's settings govern.

## Non-interactive (agents and CI)

All prompts have flag equivalents; a non-TTY stdin implies `--yes` semantics:

```bash
pnpm create ohif my-ext --scope '@acme' --template extension --modules viewport,panel --yes
```

This creates `@acme/my-ext`. Every flag is listed under [Options](#options).

## Options

```bash
pnpm create ohif [name] [options]
pnpm create ohif migrate <path> [--dry-run]
```

| Option | Meaning |
| --- | --- |
| `[name]` | The package name, for example `extension-foo` or `@acme/extension-foo`. For an extension it is also the extension `id`. Prompted for if omitted. |
| `-t`, `--template <workspace\|extension\|mode\|deployment>` | What to scaffold (see [Quick start](#quick-start)). Prompted for if omitted; the prompt defaults to `workspace`. |
| `--scope <@scope>` | Prepended to an unscoped name: `--scope '@acme'` turns `extension-foo` into `@acme/extension-foo`. Keep the quotes: some shells treat an unquoted word starting with `@` specially and pass nothing in its place. |
| `--modules <csv>` | Extension only. The modules to generate, any of `viewport`, `panel`, `commands`, `sopClassHandler`, `toolbar`, `hangingProtocol`. Default: `viewport`. |
| `--in-tree` | Extension or mode only. Write into `extensions/` or `modes/` of the enclosing OHIF checkout (see [Scaffold into a checkout](#scaffold-into-a-checkout-in-tree)). |
| `--dir <path>` | The parent folder the new package's folder is created in. In general the default is the current folder; see [Where an extension or mode is created](#where-an-extension-or-mode-is-created) for details. A relative path is resolved from the current folder. The new folder is named after the package without its scope, so `@acme/extension-foo` with `--dir C:\work` becomes `C:\work\extension-foo`. Ignored with `--in-tree`. |
| `-y`, `--yes` | Don't prompt. Needs a name and `--template`; the description defaults to `OHIF <template>` and the modules to `viewport`. A non-TTY stdin implies it. |
| `--help` | Print the usage. |
| `--version` | Print the `create-ohif` version. |

`migrate <path>` ports a CLI-era (OHIF CLI) standalone extension or mode at
`<path>` to the current plugin contract: it applies the rewrites it can and
lists the rest as flags to handle by hand. `--dry-run` prints the same report
without changing any file; that report is the migration checklist. See
[CLI-era extension → 2026 plugin contract](../migration-guide/cli-era-extensions.md)
for what each item means.

### Where an extension or mode is created

A new extension or mode is set up for the place its folder lands:

| If the new folder lands in… | It is set up as | What `create-ohif` does |
| --- | --- | --- |
| a workspace's `extensions/` or `modes/` | a workspace plugin | Adds it to the workspace's `ohif.config.json`, so `pnpm dev` links it |
| an OHIF checkout's `extensions/` or `modes/` | an in-tree package | Prints the `pluginConfig.json` entry to add and the lockfile step |
| anywhere else | its own package | Prints how to link or load it in a viewer |

Where the folder lands:

- **With `--dir`:** in `--dir`.
- **With `--in-tree`:** in the enclosing OHIF checkout's `extensions/` or `modes/`.
- **Otherwise, run from inside a workspace:** in the workspace's `extensions/` or
  `modes/`.
- **Otherwise, run from inside an OHIF checkout:** you're asked whether to put it
  in-tree. With `--yes`, or if you answer no, it goes in the current folder.
- **Anywhere else:** in the current folder.

"Inside a workspace" means the current folder, or one above it, contains
`ohif.config.json`. "Inside an OHIF checkout" means it contains both
`pnpm-workspace.yaml` and `platform/app/pluginConfig.json`.

## Register with the viewer

A scaffolded extension or mode still has to be declared before the viewer loads
it. See [Extension Installation](../platform/extensions/installation.md) and the
[`pluginConfig.json` reference](../platform/extensions/pluginConfig.md).

## Next steps

- [Develop an Extension Out-of-Tree](./out-of-tree.md) — link a local checkout
  into a viewer without publishing.
- [Publish an Extension or Mode](./publishing.md) — the packaging and publish
  flow.
- [Runtime Extensions](../platform/extensions/runtime-extensions.md) — load a
  prebuilt bundle at runtime with no viewer rebuild.

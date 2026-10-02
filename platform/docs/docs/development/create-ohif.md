---
sidebar_position: 3
sidebar_label: Create an Extension or Mode
title: Create an Extension or Mode
summary: Scaffold OHIF workspaces, extensions, modes, and deployment configs with the published create-ohif tool — the workspace-first replacement for the removed OHIF CLI's create-extension/create-mode commands.
---

# Create an Extension or Mode

`create-ohif` is a published scaffolder that replaces the removed OHIF CLI's
`create-extension` / `create-mode` commands. It generates a ready-to-build
package (or a whole workspace) that already matches the plugin contract: the
`.rspack/` UMD build config, the correct `package.json` shape, an `.npmrc` that
keeps the host-provided peers external, and an `AGENTS.md` contract summary.

## Quick start

```bash
pnpm create ohif@beta
```

:::note
Use the `@beta` tag until a `latest` dist-tag is published. Plain
`pnpm create ohif` resolves `create-ohif@latest` and fails with
"No matching version found" while only the beta tag exists.
:::

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

Running `pnpm create ohif@beta` **inside** a workspace folder scaffolds the new
extension or mode into `extensions/` or `modes/`, appends it to
`ohif.config.json`, and links it into the harness on the next `pnpm dev` — no
manual wiring.

## Extension and mode layout

A standalone extension scaffold:

```
extension-foo/
├── .npmrc                 # auto-install-peers=false (prevents a second React)
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

To develop inside a clone of the OHIF Viewers monorepo:

```bash
pnpm create ohif@beta --in-tree
```

This writes into `extensions/` or `modes/` of the enclosing checkout (detected
by walking up to a directory that has both `pnpm-workspace.yaml` and
`platform/app/pluginConfig.json`). The `extensions/*` / `modes/*` workspace
globs pick it up automatically, but you still declare it in
`platform/app/pluginConfig.json`. Add the printed entry by hand, or in one step:

```bash
pnpm run plugin add @acme/extension-foo
pnpm install --no-frozen-lockfile
```

In-tree scaffolds use `workspace:*` peer ranges and minimal devDependencies —
the monorepo's hoisted toolchain resolves the rest.

## Non-interactive (agents and CI)

All prompts have flag equivalents; a non-TTY stdin implies `--yes` semantics:

```bash
pnpm create ohif@beta my-ext --template extension --modules viewport,panel --yes
```

`--scope @acme` prepends a scope to an unscoped name, and `--dir <path>` sets
the parent directory for standalone output.

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

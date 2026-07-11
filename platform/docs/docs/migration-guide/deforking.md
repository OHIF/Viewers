---
sidebar_label: 'De-forking (fork → workspace)'
title: 'De-forking: move customizations out of a Viewers fork'
summary: The recipe for teams whose customizations live inside a fork of the Viewers repo — inventory the additive changes, scaffold a workspace pinned to the fork's base tag, move each plugin in and migrate it, port config, parity-check, and retire the fork. States plainly what a workspace cannot hold.
---

# De-forking: move customizations out of a Viewers fork

The most common way teams have customized OHIF is by **forking the Viewers
repo** and editing it in place. That works, but every upstream release is a
merge conflict, and the fork drifts further from OHIF over time.

A **workspace** replaces the fork for the common case. It is your own git repo
that owns only your extensions, modes, and config; it pulls a pinned OHIF
release into a machine-managed `.ohif/` harness at build time. Your code and
OHIF's code stop sharing a git history, so upgrades become "change the pinned
tag" instead of "resolve conflicts."

This guide walks a fork to a workspace. Each plugin you extract is then a
standard 2026-contract plugin — the
[CLI-era extension → 2026 contract](./cli-era-extensions.md) page explains the
per-plugin rewrites that `create-ohif migrate` performs.

:::danger What a workspace cannot hold — read this first
A workspace holds **additive** customizations: extensions, modes, and
`app-config.js`. It has **no home for edits you made to files under
`platform/`** (core, app, or UI internals). If your fork patches OHIF core, you
have two honest options for that part:

- **Upstream it** — open a PR so the change lives in OHIF and you stop carrying
  it, or
- **Keep a fork for that part alone** — a much smaller fork that carries only
  the core patch, with your plugins and config moved out into the workspace.

This guide will not pretend a core patch can be moved into a workspace. Decide
its fate per patch during the inventory step below.
:::

---

## Step 1 — Inventory the fork's additive changes

Diff your fork against the upstream tag it is based on and sort every change
into one of three buckets:

```bash
# from your fork checkout; replace with your actual base tag
git diff --stat v3.13.0-beta.116..HEAD
```

- **Extensions / modes** — anything under `extensions/` or `modes/` that you
  added. Each becomes a folder you move into the workspace.
- **Config** — your edits to an app config (`platform/app/public/config/*.js`),
  `pluginConfig.json`, hanging protocols wired at the app level, hotkeys,
  data sources. This becomes `config/app-config.js` in the workspace.
- **Core patches** — any edit under `platform/` that is *not* a plugin. These
  do **not** move (see the notice above). Mark each one "upstream" or "keep a
  minimal fork" now, before you go further.

The base tag you find here is the tag you pin the workspace to in Step 2 — the
workspace must start life at parity with the OHIF your fork was built on, not
at whatever is newest.

---

## Step 2 — Scaffold a workspace at the fork's base tag

```bash
pnpm create ohif@beta -t workspace
```

Answer the prompts, then pin the workspace to the tag from Step 1 by setting
`ohifVersion` in the generated `ohif.config.json` (the committed manifest):

```json title="ohif.config.json"
{
  "ohifVersion": "3.13.0-beta.116",
  "plugins": [],
  "appConfig": {}
}
```

The workspace is one folder — your own git repo — with `extensions/`,
`modes/`, `config/app-config.js`, and a `scripts/ohif.mjs` that manages the
`.ohif/` harness. Nothing OHIF-owned lives in your repo; `.ohif/` is
gitignored, machine-managed, and disposable. Run this once to populate it:

```bash
pnpm dev   # runs "harness ensure": shallow-clones the pinned tag, installs, links your plugins
```

`harness ensure` shallow-clones the pinned OHIF tag into `.ohif/`, installs it,
writes a `directory` `pluginConfig` entry per manifest plugin, and syncs your
`config/app-config.js` into the harness. Confirm a stock viewer boots before
you move anything in — that is your parity baseline.

---

## Step 3 — Move each plugin in and migrate it

For each extension/mode from the Step 1 inventory, drop its folder into
`extensions/` or `modes/`, then bring it to the current contract:

```bash
# from inside the workspace, for each plugin folder you moved in
pnpm create ohif@beta migrate ./extensions/my-extension --dry-run   # read the report
pnpm create ohif@beta migrate ./extensions/my-extension             # apply it
```

The migration report is your per-plugin checklist; the
[CLI-era extension → 2026 contract](./cli-era-extensions.md) page explains the
why behind each `[rewrite]` and what each `[flag]` asks you to do by hand
(notably `@ohif/ui` → `@ohif/ui-next` source changes, which migrate never
rewrites).

Register each plugin in the workspace manifest and link it into the harness:

```bash
pnpm plugin add my-extension
```

For a plugin scaffolded fresh, running `create-ohif` **inside** the workspace
places it under `extensions/`/`modes/`, appends it to the manifest, and links
it automatically.

---

## Step 4 — Port config into `config/app-config.js`

Copy the config-bucket changes from Step 1 into the workspace's
`config/app-config.js`: data sources, hanging protocols, hotkeys,
customizations, and the extension/mode wiring your fork did at the app level.
`pnpm dev` syncs this file into the harness on every run, so this one file is
the whole config surface — there is no forked app config to keep in step.

---

## Step 5 — Parity-check with `pnpm dev`

```bash
pnpm dev
```

All workspace plugins are source-compiled with HMR against the pinned OHIF.
Walk the flows your fork supported — the modes load, panels render, tools work,
data sources connect — and compare against the baseline from Step 2. Anything
missing is either a plugin still to migrate (Step 3), config not yet ported
(Step 4), or a **core patch** that a workspace cannot carry (revisit the
notice at the top).

---

## Step 6 — Retire the fork

Once parity holds:

- The workspace repo is now the source of truth for your extensions, modes, and
  config. Commit it.
- **Upgrading OHIF** is `pnpm plugin`-managed: change `ohifVersion` (or run
  `harness upgrade <tag>`) and re-run `pnpm dev`; the harness re-clones and
  re-links. No merge conflicts.
- For any **core patch** you decided to keep: reduce the old fork to just that
  patch, or upstream it and delete the fork entirely.
- Deployment moves to the workspace's built `dist` (its `Dockerfile`) or a
  stock `ohif/app` image with your `app-config.js` — see the workspace and
  deployment templates.

---

## Related

- **[CLI-era extension → 2026 contract](./cli-era-extensions.md)** — the
  per-plugin rewrite reference this guide sends each moved plugin through.
- **[Extension installation](../platform/extensions/installation.md)** and
  **[`pluginConfig.json` reference](../platform/extensions/pluginConfig.md)** —
  how plugins are declared once they live in the workspace.

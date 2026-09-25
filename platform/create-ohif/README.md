# create-ohif

Scaffold OHIF Viewer extensions and modes.

## Usage

Until a stable (latest-tagged) release exists, always pin the beta dist-tag:

    pnpm create ohif@beta my-extension

`pnpm create ohif` (no tag) resolves create-ohif@latest and will fail with
"No matching version found" while only the beta tag exists.

## Arguments

```
create-ohif [name] [options]
  -t, --template <extension|mode>
      --scope <@scope>        prepended when the positional name is unscoped
      --modules <csv>         extension only; subset of: viewport,panel,commands,sopClassHandler,toolbar,hangingProtocol
      --in-tree               scaffold into extensions/|modes/ of the enclosing OHIF checkout
      --dir <path>            parent directory for standalone output (default: cwd)
  -y, --yes                   non-interactive; requires name and --template; defaults: modules=viewport, description auto
      --help, --version
```

When arguments are omitted (and stdin is a TTY), an interactive prompt flow
collects the name, template, extension modules, and description. Non-TTY
stdin implies `--yes` semantics.

## Extension modules

| Module key        | Emits                                                        |
| ----------------- | ------------------------------------------------------------ |
| `viewport`        | `src/getViewportModule.tsx`, `src/viewports/ExampleViewport.tsx` |
| `panel`           | `src/getPanelModule.tsx`, `src/panels/ExamplePanel.tsx`      |
| `commands`        | `src/commandsModule.ts`                                      |
| `sopClassHandler` | `src/getSopClassHandlerModule.ts`                            |
| `toolbar`         | `src/getToolbarModule.tsx`                                   |
| `hangingProtocol` | `src/getHangingProtocolModule.ts`                            |

Unselected modules leave neither files nor references in `src/index.tsx`.

## In-tree workflow

Run from anywhere inside an OHIF Viewers checkout (detected by walking up to a
directory containing both `pnpm-workspace.yaml` and
`platform/app/pluginConfig.json`), or pass `--in-tree` explicitly:

    node platform/create-ohif/bin/create-ohif.mjs my-ext --template extension --in-tree

The scaffold lands in `extensions/<name>` or `modes/<name>` with
`workspace:*` peer ranges and minimal devDependencies. Afterwards:

1. Add the printed entry to `platform/app/pluginConfig.json` (or run
   `pnpm plugin add <packageName>`).
2. Run `pnpm install --no-frozen-lockfile` to register the new workspace
   package.

Standalone scaffolds instead stamp `^<version>` peer ranges matching the
create-ohif release, and print the runtime-descriptor and directory-mode
pluginConfig snippets for loading the built package into a host viewer.

## Releasing

CI publishes this package with the rest of the monorepo: `publish-version.mjs`
stamps its version on every release and `publish-package.mjs` publishes it
(with `--tag beta` when releasing from master, the default `latest` tag
otherwise). Promoting a stable tag:

- Option A (default, no code change): wait for the first non-master release
  publish — the default tag makes that version `latest` automatically.
- Option B (opt-in, manual or one CI line): promote a specific beta explicitly
  with `npm dist-tag add create-ohif@<version> latest` once the scaffolder is
  deemed stable, enabling bare `pnpm create ohif` early.

Do not auto-promote from the master pipeline — that would make `latest` a
beta.

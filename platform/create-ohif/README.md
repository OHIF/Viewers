# create-ohif

Scaffold OHIF Viewer extensions and modes.

## Usage

    pnpm create ohif my-extension

## Running a local copy

`pnpm create ohif` always downloads create-ohif from npm. To run the copy in an
OHIF checkout instead (to test unreleased changes, or before a version is
published), call its entry point with Node:

    node <checkout>/platform/create-ohif/bin/create-ohif.mjs my-ext --template extension

The options are the same, and edits to the checkout take effect on the next run.

## Arguments

```
create-ohif [name] [options]
create-ohif migrate <path> [--dry-run]

  -t, --template <workspace|extension|mode|deployment>
      --scope <@scope>   prepended when the positional name is unscoped; quote it ('@acme')
      --modules <csv>    extension only; subset of: viewport,panel,commands,sopClassHandler,toolbar,hangingProtocol
      --in-tree          scaffold into extensions/|modes/ of the enclosing OHIF checkout
      --dir <path>       parent folder for the new package's folder (default: the
                         current folder); ignored with --in-tree
  -y, --yes              non-interactive; requires name and --template;
                         defaults: modules=viewport, description auto
      --help             print this message
      --version          print the create-ohif version
```

`migrate` ports a CLI-era (OHIF CLI) standalone extension or mode at `<path>`
to the current plugin contract. `--dry-run` prints the full migration report
without touching any file; that report is the migration checklist.

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
2. Run `pnpm run install:update-lockfile` to register the new workspace
   package (a deliberate lockfile update).

Standalone scaffolds instead stamp `^<version>` peer ranges matching the
create-ohif release, and print the runtime-descriptor and directory-mode
pluginConfig snippets for loading the built package into a host viewer.

## Releasing

CI publishes this package with the rest of the monorepo: `publish-version.mjs`
stamps its version on every release and `publish-package.mjs` publishes it,
with `--tag beta` from master and the default `latest` tag from `release/*`.
Until the first stable release, `publish-package.mjs` also moves `latest` to
each new master beta, so plain `pnpm create ohif` always gets the current beta.
Once a stable version is `latest`, master betas no longer move it.

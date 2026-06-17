# MIMPS — Medical Imaging Platform 

## Quick start

```bash
yarn install
yarn dev                      # development server (default config)

# production bundle (config pinned to platform/app/public/config/blackvoxel.js)
cd platform/app && yarn build:viewer
```

## Layout

- `platform/app` — the viewer application shell
- `platform/{core,ui-next,i18n,cli}` — core services, UI library, i18n, tooling
- `extensions/` — feature plugins (`blackvoxel-ai` holds the AI findings panel)
- `modes/` — workflow configurations (the demo uses the longitudinal mode,
  displayed as "Visualizador Básico")

Production configuration lives in
`platform/app/public/config/blackvoxel.js` (same-origin Orthanc DICOMweb
gateway under `/pacs/`). See `AGENTS.md` / `CLAUDE.md` for architecture and
contribution conventions.

## Attribution and license

MIMPS is a fork of the open-source
[OHIF Viewers](https://github.com/OHIF/Viewers) project (MIT license) by the
Open Health Imaging Foundation. Internal package names under the `@ohif/*`
scope are retained for build compatibility; all product branding and
BlackVoxel-specific functionality are maintained by BlackVoxel.

MIT License.

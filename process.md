# UI-Next Prototype Playground Setup

## Goal
Enable design prototypes that render UI-Next components exactly as they appear in the viewer without Docusaurus interference.

## Approach
Revive the existing `yarn dev` pathway inside `platform/ui-next` by reinstating the webpack playground it expected. The playground serves a minimal React shell that wraps prototypes with `ThemeWrapper`, guaranteeing the Tailwind token set and shared CSS match the production viewer.

## Work Completed
- Added `platform/ui-next/playground/index.tsx`, a blank page that mounts `ThemeWrapper` and renders a full-height black background. This file is the entry point for future layout experiments.
- Restored `platform/ui-next/.webpack/webpack.playground.js`. The script already referenced this path; recreating it re-enabled webpack dev tooling with the shared base config, HTML template, and a dev server on port 3100.
- Confirmed the repo still uses the shared `.webpack/webpack.base.js`, ensuring Tailwind, aliases, and asset handling behave just like the viewer bundle.

## Launch Instructions
```bash
cd platform/ui-next
yarn dev
# open http://localhost:3100
```

## Important Notes
- The docs site (`platform/docs`) layers Docusaurus styles and routing on top of prototypes, so we are moving experiments to the playground to avoid those conflicts.
- The `dev` script always targeted `.webpack/webpack.playground.js`; the config file had been removed earlier, leaving the script broken. Re-adding it keeps historical tooling intact, so developers do not need to adopt new commands.
- Prototype pages should import from `../src/components/...` (or published package paths once available) and stay within the `playground` folder. Keep context providers and data stubs local to prototypes to avoid touching app code.
- The playground output directory is `platform/ui-next/dist/playground`; it is disposable and should not be checked in.
- When adding new layouts, continue wrapping content with `ThemeWrapper` (or additional providers if required) so tokens remain aligned with the viewer.

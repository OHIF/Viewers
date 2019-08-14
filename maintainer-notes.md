## Notes

### Helpful Commands

These commands are less frequently used, but good to remember:

```bash
# Add shared dev dependency for workspace
yarn add --dev -W package-name
```

## TODO

- Patch status for PRs (we care about threshold only)
  - Allows us to use multiproject test runner
- Flags per project for merged coverage; easier to break down coverage per
  project
- Remove all-contributors bot; install CLI per project and add per project
  commands
- Verify all have "dev:package-name" command
  - Should we include `package.json` and `src` as output? (build from ESM)
  - Should we remove `dev:package-name` commands and suggest navigating to
    package root?
- Fix broken peer dependencies?
- Lingering core-js resolution issues when building for Viewer PWA (from project
  directory)

## ORBS

- Slack: https://circleci.com/orbs/registry/orb/circleci/slack
- GCP: https://circleci.com/orbs/registry/orb/circleci/gcp-cli
- Browser Tools: https://circleci.com/orbs/registry/orb/circleci/browser-tools
- Multi-Repo: https://circleci.com/orbs/registry/orb/dnephin/multirepo
- PR Comment: https://circleci.com/orbs/registry/orb/benjlevesque/pr-comment

Debug Note: `http://localhost:3000/webpack-dev-server`

NOTES:

# bumps pre-release version of all packages if any changes

- `npx lerna version prerelease`

# Releases based on package.json differences from NPM

- `npx lerna publish from-package --dist-tag canary`

Use Env options to set config:

- https://webpack.js.org/api/cli/#environment-options

## Bundling

- Extensions must bundle all assets into a single file for UMD
- The umd build for Viewer must bundle all of it's assets, and baked-in
  extension assets
  - The "skinny" umd build for viewer only needs to bundle it's own assets
- The PWA build for Viewer can code-split to it's heart's content
- Don't load/bundle a font at any layer other than Application/Viewer
- It gets to decide if it should be bundled/cached/external

* For ESM/Module builds
* Not dissimilar from VTK.js consumption
* jest --watchAll for individual packages?

WebPack 5: https://github.com/webpack/webpack/issues/6386#issue-291757876

Flattened ESM: Less efficient, not as great at code splitting? From source? More
loaders, added complexity, slower builds, better output

Notes:

- Remove preBuild step in viewer after @3 wado image loader

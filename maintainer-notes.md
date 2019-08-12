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
-

NOTES:

# bumps pre-release version of all packages if any changes

- `npx lerna version prerelease`

# Releases based on package.json differences from NPM

- `npx lerna publish from-package --dist-tag canary`

Issue: lerna info lifecycle root@undefined~publish: Failed to exec publish
script lerna ERR! lifecycle "publish" errored in "root", exiting 1

Use Env options to set config:

- https://webpack.js.org/api/cli/#environment-options

## Bundling

- Extensions must bundle all assets into a single file for UMD
- The umd build for Viewer must bundle all of it's assets, and baked-in
  extension assets
  - The "skinny" umd build for viewer only needs to bundle it's own assets
- The PWA build for Viewer can code-split to it's heart's content

Verify all have "dev:package-name" command Should we include `package.json` and
`src` as output?

- For ESM/Module builds
- Not dissimilar from VTK.js consumption
- jest --watchAll for individual packages?

WebPack 5: https://github.com/webpack/webpack/issues/6386#issue-291757876

Flattened ESM: Less efficient, not as great at code splitting? From source? More
loaders, added complexity, slower builds, better output

CleanWebpack Plugin: https://github.com/johnagan/clean-webpack-plugin

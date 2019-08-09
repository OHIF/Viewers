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

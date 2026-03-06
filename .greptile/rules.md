# Greptile review rules

## CS3D integration branches (tarball deps)

When a PR or branch has `package.json` or lockfile changes that reference **Cornerstone3D GitHub release tarball URLs** (e.g. `https://github.com/cornerstonejs/cornerstone3D/releases/download/...` for `@cornerstonejs/*` dependencies):

- **Do not** recommend blocking merge or leave review comments solely on the grounds that "this shouldn't be merged" or "tarball refs must be reverted" for that reason alone.
- The **"No CS3D tarball deps"** GitHub Actions check already fails on such changes and blocks merge until deps are reverted to npm versions. Redundant merge-block recommendations are unnecessary.
- You may still review other aspects of the PR (logic, tests, unrelated files) as usual.

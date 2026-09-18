---
sidebar_position: 10
sidebar_label: CS3D Integration Testing
title: Cornerstone3D Integration Testing
summary: How to test OHIF against specific Cornerstone3D branches or versions, both locally and in CI.
---

# Cornerstone3D Integration Testing

OHIF can be tested against a specific Cornerstone3D (CS3D) branch or published version.
This is useful for:

- Validating OHIF changes against unreleased CS3D features
- Upgrading CS3D versions with automated testing
- Debugging issues that span both repositories

## CI Workflow

The **Playwright Tests** workflow in GitHub Actions has built-in CS3D integration support.

### Triggering from a pull request

Open a PR targeting `master` or `release/*`, then add a `CS3D_REF` line anywhere in the PR
description body:

```
CS3D_REF: main
```

or

```
CS3D_REF: 5.10.6
```

The line itself is the request. There is no label, and there is no default: a PR with no
`CS3D_REF` line runs the ordinary Playwright suite against the CS3D version this repo
already pins. A line inside a fenced code block is ignored, so a PR can document this
syntax without triggering it.

The workflow reads the PR body live on every run, so you can change the line and re-run
without pushing a commit.

:::caution
The branch must live in the `cornerstonejs/cornerstone3D` repository. The old
`<owner>:<branch>` form is rejected — it let a PR point the clone at any GitHub account
and run that account's install scripts on the shared self-hosted runner.
:::

### Triggering via workflow_dispatch

Use **Actions > Playwright Tests > Run workflow** and set the `cs3d_ref` input. The input
accepts the same forms as the PR body line, and it also has no default — leave it empty to
run the ordinary suite.

| Input | Behavior |
|-------|----------|
| *(empty)* | Run the ordinary suite against the pinned CS3D version |
| `5.10.6` | Install exact version 5.10.6 |
| `5.11.0-beta.1` | Install exact prerelease |
| `5.10.x` | Install latest 5.10.x release |
| `5.x` | Install latest published 5.x release |
| `main` | Clone and build the `cornerstonejs/cornerstone3D` `main` branch from source |

### Branch vs Version Behavior

**Version path** (e.g., `5.x`, `5.10.6`):
- Installs OHIF dependencies normally
- Updates all `@cornerstonejs/*` versions in workspace package.json files
- Re-installs to fetch the specified versions from npm
- Runs all tests
- Builds and deploys a Netlify preview
- The tested version is read back from `node_modules` and logged in workflow annotations

**Branch path** (e.g., `main`, `feat/foo`):
- Clones CS3D into `libs/@cornerstonejs`
- Builds CS3D from source (`pnpm run build:esm`)
- Links built packages into OHIF's `node_modules`
- Runs all tests
- Builds and deploys a Netlify preview
- The **CS3D Branch Merge Guard** job reports a red result, because merging would leave
  `master` depending on unreleased CS3D code. The guard is advisory — it reports, it does
  not block the merge button.

### Retiring a branch ref

Once the CS3D change is released, change the line rather than deleting it:

```
CS3D_REF: feat/my-feature now 5.10.6
```

The version after `now` is a **record, not a request**. On every run the workflow compares
it against the version this repo pins and keeps whichever is newer, so the line can never
drag the pin backwards. A line still saying `now 5.10.6` in a repo that has moved on to
5.11.0 tests 5.11.0.

That is what lets the line stay in place as history: the branch name remains visible as the
reason the pinned version moved, and once the repo pins that version or something newer the
line stops changing the run — no rewrite, no reinstall, and no preview deploy. The merge
guard also passes, because what the PR depends on is a published release.

The version after `now` must be one concrete release, such as `5.10.6` or `5.11.0-beta.1`.
A range is rejected, because it would resolve to a different version on a later run and the
record would stop meaning what it said.

:::note
A PR from a fork still requests approval on the `cs3d-integration` environment while the
line is present, even after the line is spent. The gate that makes that decision has no
checkout by design, so it cannot tell which version the repo pins. Delete the line to stop
the prompt.
:::

### Approval and deferral for fork PRs

Two rules apply to a PR from a fork, and to no other PR:

- **An integration run waits for approval.** A `CS3D_REF` line asks the shared self-hosted
  runner to build and execute CS3D code, so the run pauses on the `cs3d-integration`
  environment until one of the named reviewers approves that specific run.
- **A PR that changes a CI-defining file does not run Playwright until it is merged.** The
  paths are `.github/`, `.scripts/`, `package.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml`,
  `preinstall.js`, `.npmrc` and any root pnpmfile. `pnpm install` runs package install
  scripts on the runner, so a change to `package.json` or the lockfile can execute code
  there before any test starts.

A PR from a branch in the OHIF repository is unaffected by both rules: the branch lives in
this repo, so someone with write access pushed it.

### Version Commit on Merge

The CS3D version update is **not committed** during the PR workflow. The tested version is
recorded in workflow annotations (`::notice::` messages). To apply the version update:

1. After the PR is approved and the version test passes, note the tested version from the logs
2. Run `node .scripts/cs3d-set-version.mjs <version>` locally or as part of the merge process
3. Commit the updated package.json files

## Local Development

### Setting Up a CS3D Worktree

For local development, use the CS3D repo's `link:cs3d` script to create a git worktree.
This shares a single git repository across multiple OHIF checkouts:

```bash
# From your cornerstone3D repo:
bun run link:cs3d /path/to/ohif main
# or with a specific branch:
bun run link:cs3d /path/to/ohif origin:feat/my-feature
```

This creates `libs/@cornerstonejs` as a worktree and generates `link-cs3d.js` / `unlink-cs3d.js`
helper scripts. See the [Local Linking](./link.md) docs for more on the linking workflow.

### Package Scripts

Once `libs/@cornerstonejs` exists (via worktree or clone):

```bash
# Switch branches in the existing worktree
yarn cs3d:checkout <branch-name>

# Install dependencies and build ESM
yarn cs3d:build

# Symlink CS3D packages into node_modules/@cornerstonejs
yarn cs3d:link

# Remove symlinks and restore packages from npm registry
yarn cs3d:unlink
```

:::note
`cs3d:checkout` requires `libs/@cornerstonejs` to already exist. It runs
`git fetch && git checkout` inside that directory.
:::

### Wildcard Versions

The `cs3d-resolve-version.mjs` script resolves patterns like `5.x` or `5.10.x`:

```bash
node .scripts/cs3d-resolve-version.mjs 5.x
# prints: 5.10.6  (or whatever the latest 5.x release is)
```

### Updating All CS3D Versions

```bash
node .scripts/cs3d-set-version.mjs 5.10.6
# Updates all @cornerstonejs/* dependencies across the workspace

node .scripts/cs3d-set-version.mjs 5.10.6 --only-if-newer
# Same, but refuses to move the pin backwards
```

The workflow uses `--only-if-newer` for the version recorded after `now` in a retiring
`CS3D_REF` line, which is how a spent line stops changing the run. Without the flag the
requested version is applied as given, downgrades included.

This updates the 8 main CS3D packages (adapters, ai, core, dicom-image-loader,
labelmap-interpolation, nifti-volume-loader, polymorphic-segmentation, tools)
but not codec packages.

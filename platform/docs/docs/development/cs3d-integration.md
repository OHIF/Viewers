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

## The `.cs3d-ref` File (Canonical)

The committed `.cs3d-ref` file at the repository root is the **single source of truth**
for which Cornerstone3D to build against. One file drives every CI system:

| System | Entry point |
|--------|-------------|
| CircleCI (unit, Cypress, package build) | `.scripts/ci/setup-cs3d.sh` |
| Netlify | `netlify.toml` → `setup-cs3d.sh` |
| GitHub Actions Playwright | `.scripts/ci/cs3d-check-integration.sh` |

**How it works**

- The first **uncommented, non-blank** line is the active ref.
- A **version** (`4.19+`, `4.18.2`, `4.x`) pins `@cornerstonejs/*` to that published
  version and reinstalls.
- A **branch** (`main`, `owner:branch`) is cloned, built (`build:esm`), and symlinked
  into `node_modules`. Branch refs are **blocked from merging** to `master`/`release/*`
  by the CS3D Branch Merge Guard.

**Enabling and disabling**

To disable integration, **comment the active line out — do not delete the file**.
Keeping the file preserves its inline instructions for the next integration. The steady
state on `master`/`release/*` is "no active line".

**Build / deploy with a linked CS3D build**

```bash
# Set the active line in .cs3d-ref, then:
bash .scripts/ci/setup-cs3d.sh   # clone+build+link a branch, or pin+reinstall a version
pnpm run build                   # or: pnpm run dev / pnpm run build:ci

# Ad-hoc override without editing the file:
CS3D_REF=cornerstonejs:feat/foo bash .scripts/ci/setup-cs3d.sh
```

In CI, push the branch with the active line set; CircleCI, Netlify, and Playwright all
pick it up, and Playwright deploys a Netlify preview. Comment the line out (or set a
published version) before merging so protected-branch CI builds against the lockfile.

## CI Workflow

The **Playwright Tests** workflow in GitHub Actions has built-in CS3D integration
support. It reads the ref from `.cs3d-ref` first; the label and PR-body mechanism below
is a fallback used when `.cs3d-ref` has no active line.

### Triggering via Label

1. Open a PR targeting `master` or `release/*`
2. Add the **`ohif-integration`** label
3. The workflow will automatically test against the latest `4.x` CS3D release from npm

To target a specific CS3D branch or version, add a `CS3D_REF` line anywhere in the PR
description body:

```
CS3D_REF: main
```

or

```
CS3D_REF: 4.18.2
```

The same branch and version formats from the table below are supported. If no `CS3D_REF`
line is found in the PR body, it defaults to `4.x`.

### Triggering via workflow_dispatch

Use **Actions > Playwright Tests > Run workflow** and set the `cs3d_ref` input:

| Input | Behavior |
|-------|----------|
| `4.x` (default) | Install latest published 4.x release |
| `4.18.2` | Install exact version 4.18.2 |
| `4.18.2-beta.3` | Install exact prerelease |
| `4.17.x` | Install latest 4.17.x release |
| `main` | Clone and build CS3D `main` branch from source |
| `myorg:feat/foo` | Clone from `github.com/myorg/cornerstone3D.git`, branch `feat/foo` |

### Branch vs Version Behavior

**Version path** (e.g., `4.x`, `4.18.2`):
- Installs OHIF dependencies normally
- Updates all `@cornerstonejs/*` versions in workspace package.json files
- Re-installs to fetch the specified versions from npm
- Runs all tests
- Builds and deploys a Netlify preview
- The tested version is logged in workflow annotations

**Branch path** (e.g., `main`, `myorg:feat/foo`):
- Clones CS3D into `libs/@cornerstonejs`
- Builds CS3D from source (`build:esm`)
- Links built packages into OHIF's `node_modules`
- Runs all tests
- Builds and deploys a Netlify preview
- **Intentionally fails** at the end to prevent merging — re-run with a published version before merge

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

The `cs3d-resolve-version.mjs` script resolves patterns like `4.x` or `4.17.x`:

```bash
node .scripts/cs3d-resolve-version.mjs 4.x
# prints: 4.19.1  (or whatever the latest 4.x release is)
```

### Updating All CS3D Versions

```bash
node .scripts/cs3d-set-version.mjs 4.19.0
# Updates all @cornerstonejs/* dependencies across the workspace
```

This updates the 8 main CS3D packages (adapters, ai, core, dicom-image-loader,
labelmap-interpolation, nifti-volume-loader, polymorphic-segmentation, tools)
but not codec packages.

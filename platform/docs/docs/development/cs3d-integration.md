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
already pins.

The line must sit at the top level of the body. The workflow ignores a `CS3D_REF` line in
any of three places, because a reader takes each of them as an example and not as an
instruction:

- inside a fenced code block, which is how a PR documents this syntax without triggering it;
- inside an indented code block, which means four spaces or more;
- inside an HTML comment. The OHIF pull request template is almost entirely HTML comments,
  so write the line outside them.

The workflow prints a warning when it ignores a `CS3D_REF` line for one of these reasons.
It fails the gate when the code block or the comment that hides the line is never closed,
because an unclosed block hides every line below it, and a request written there would
otherwise disappear without a word.

The workflow reads the PR body live on every run, so you can change the line and re-run
without pushing a commit.

:::caution
The branch must live in the `cornerstonejs/cornerstone3D` repository. The old
`<owner>:<branch>` form is rejected — it let a PR point the clone at any GitHub account
and run that account's install scripts on the shared self-hosted runner.
:::

### Integrated build of a CS3D pull request from a fork

A `CS3D_REF` line cannot name a branch of a fork. The scripts reject the `<owner>:<branch>`
form and a URL, and they clone from `cornerstonejs/cornerstone3D` only. To test a CS3D pull
request from a fork with OHIF, a CS3D maintainer pushes a copy of the fork branch to
`cornerstonejs/cornerstone3D`. The OHIF PR names that copy.

For example, cornerstonejs/cornerstone3D#2992 comes from the branch
`feat/viewport-fidelity-state` of the fork `mbellehumeur/cornerstone3D`. That branch
contains cornerstonejs/cornerstone3D#2931, which has its branch in
`cornerstonejs/cornerstone3D`. OHIF/Viewers#6295 tests both CS3D pull requests in one build:

1. Merge `main` into the CS3D base branch, `feat/multires-voxel-manager-base`, and push it.
2. Merge the base branch into the fork branch. Push the merge to the fork, if the pull
   request permits edits from maintainers.
3. Push the same commit to `cornerstonejs/cornerstone3D`, with the same branch name:

   ```bash
   git push origin HEAD:refs/heads/feat/viewport-fidelity-state
   ```

4. Put the line `CS3D_REF: feat/viewport-fidelity-state` in the body of the OHIF PR.
5. Push a commit to the OHIF PR, so that Netlify builds the deploy preview again.

A new commit on the fork does not change the integrated build. A maintainer must push the
same commit to the copy. Thus a maintainer decides which fork code runs in CI, and the copy
shows the exact commit that CI tested. After CS3D releases the change, retire the line as
[Retiring a branch ref](#retiring-a-branch-ref) describes, and delete the copy branch.

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
| `4.19+` | Install the latest 4.19.0 or later release within major version 4 |
| `main` | Clone and build the `cornerstonejs/cornerstone3D` `main` branch from source |

The version forms are exactly these five: `5.10.6`, `5.11.0-beta.1`, `5.10.x`, `5.x` and
`4.19+`. A value that is written only from digits, dots, `x` and `+`, and that is not one of
the five, is rejected by the gate with a message that names the accepted forms. A two-part
number such as `5.10` is the common mistake: write `5.10.x` for the latest 5.10 release, or
name the exact release. A branch whose name merely starts with a digit, such as
`5.x-backport`, is still treated as a branch.

### Branch vs Version Behavior

**Version path** (e.g., `5.x`, `5.10.6`):
- Installs OHIF dependencies normally
- Updates all `@cornerstonejs/*` versions in workspace package.json files
- Re-installs to fetch the specified versions from npm
- Runs all tests
- The tested version is read back from `node_modules` and logged in workflow annotations

**Branch path** (e.g., `main`, `feat/foo`):
- Clones CS3D into `libs/@cornerstonejs`
- Builds CS3D from source (`pnpm run build:esm`)
- Links built packages into OHIF's `node_modules`
- Runs all tests
- The **CS3D Branch Merge Guard** job reports a red result, because merging would leave
  `master` depending on unreleased CS3D code. The guard is advisory — it reports, it does
  not block the merge button.

### CircleCI, and the deploy previews

The same `CS3D_REF` line also applies to these CircleCI jobs, and to the Netlify deploy
preview:

| Job | Where |
|-----|-------|
| CircleCI `UNIT_TESTS` (jest) | `.circleci/config.yml` |
| CircleCI `BUILD_PACKAGES_QUICK` | `.circleci/config.yml` |
| CircleCI `Cypress Tests` | `.circleci/config.yml` |
| Netlify `deploy-preview-<N>` | `netlify.toml` |

All of the jobs, and the Playwright workflow, run `.scripts/ci/cs3d-apply-ref.sh` after the
ordinary install. The script does nothing for no line, a version rewrite and a reinstall for a
version, or a clone, a build and a link for a branch. Before this, the CircleCI jobs always
used the pinned version, so a PR that needed an unreleased CS3D change failed there even when
Playwright passed.

`.scripts/cs3d-read-ref.mjs` is the one parser of the line:

- The Playwright `gate` job runs the copy of the parser on `master`, never the copy of the PR,
  so a PR cannot rewrite its own gate. A change to the parser reaches the gate only after the
  merge. The gate passes its checked result to the script with `--kind`, `--ref` and
  `--defer`, so the self-hosted runner acts only on that ref.
- The CircleCI jobs run the copy of the PR, which reads the body through the GitHub API.
  CircleCI runs the code of the PR in any case, so that copy adds no trust.
- The `UNIT_TESTS` job runs `node --test .scripts/cs3d-read-ref.test.mjs`.

CircleCI gives the build only the PR number, not the body. Without a token, the GitHub API
allows a small number of requests per hour from each address. Set a read-only `GITHUB_TOKEN`
in the CircleCI project settings: a fine-grained token with read-only access to public
repositories and no other permission. The code of each PR, and of each CS3D branch that it
names, runs in the same job. CircleCI gives project secrets only to same-repo builds, so keep
"Pass secrets to builds from forked pull requests" off. The script sends the token only in a
request header, and never prints it. When the API does not answer, the job prints a warning
and uses the pinned version, so an ordinary PR does not fail for that reason. When GitHub
rejects the token (HTTP 401), for example after the token expires, the script reads the body
once more without the token and prints a warning to replace the token.

A version line reinstalls with `--ignore-scripts`: no lockfile covers the new tree, so no
install script of it runs. The script replaces an existing `libs/@cornerstonejs` only on
CircleCI, GitHub Actions or Netlify's build servers, never on a developer machine, even when
`CI=true` is set. A local `netlify build` does not count as Netlify: it sets `NETLIFY_LOCAL`,
and it has no `BUILD_ID`.

The CircleCI job sees the PR only when the branch has an open PR at the start of the
pipeline; re-run the pipeline after you open the PR, or after you change the line.

A branch build adds the CS3D install and build to each job. The Cypress job runs on 8
parallel containers, and each container builds CS3D.

#### The Netlify deploy preview

The Netlify `deploy-preview-<N>` build also reads the `CS3D_REF` line, through
`.scripts/ci/cs3d-apply-ref.sh` in the build command of `netlify.toml`. Netlify gives the PR
number in `REVIEW_ID`. So the deploy preview is an integrated build that you can test before
the CS3D change merges.

What a PR author and a reviewer can expect from `deploy-preview-<N>`:

- No line: the pinned CS3D, as before.
- A version line: the pins move to that version. A branch line: the build clones, builds and
  links that branch of `cornerstonejs/cornerstone3D`. The build takes longer, because it also
  installs and builds CS3D; keep the total under the build time limit of the Netlify site.
- A rejected line, for example `CS3D_REF: 5.10`, fails the deploy preview.
- When the build cannot read the PR body (for example because of the GitHub rate limit), the
  deploy preview uses the pinned CS3D, and the deploy log shows a warning. A PR with no line
  does not fail for that reason. A PR that needs an unreleased CS3D API still fails on its
  build errors, and the warning tells why. Retry the deploy later.
- Netlify builds a preview when you push, not when you edit the PR body. Push a commit after
  you add or change the line.
- A fork PR can name any branch of `cornerstonejs/cornerstone3D`, and its deploy preview builds
  it without approval. Netlify runs the code of a fork PR in any case. No PR can name a branch
  of a CS3D fork; see
  [Integrated build of a CS3D pull request from a fork](#integrated-build-of-a-cs3d-pull-request-from-a-fork).

The build reads the PR body through the GitHub API. Without a token, the GitHub API allows a
small number of requests per hour from each address, and Netlify's build servers share their
addresses. To avoid the limit, add `GITHUB_TOKEN` to the environment of the Netlify site: a
fine-grained token with read-only access to public repositories and no other permission. Mark
it as a secret value, and set the site's policy for sensitive variables in untrusted deploys to
"deploy without sensitive variables".

That policy withholds the token only from an untrusted deploy. Netlify trusts a fork PR when
its author is a member of the Netlify team, and that build gets the token. A fork PR runs its
own `netlify.toml`, so that build can read the token. This risk is acceptable, because the
token is read-only and has access to public repositories only. A fork PR from another author
gets no token, and can still hit the rate limit.

Netlify keeps ignored files and `node_modules` between builds. So each Netlify build first
removes a `libs/@cornerstonejs`, and reinstalls when `node_modules` still holds a CS3D that
an earlier build linked or re-pinned. After a successful build that changed CS3D,
`--after-build` deletes `node_modules` and `libs/@cornerstonejs`, and restores the pinned
versions, so that the build cache does not keep the CS3D of the PR.

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
line stops changing the run — no rewrite and no reinstall. The merge
guard also passes, because what the PR depends on is a published release.

The version after `now` must be one concrete release, such as `5.10.6` or `5.11.0-beta.1`.
A range is rejected, because it would resolve to a different version on a later run and the
record would stop meaning what it said.

:::note
A PR from a fork still requests approval on the `cs3d-integration` environment while the
line is present, even after the line is spent. The gate that makes that decision has no
checkout of the PR by design, so it cannot tell which version the repo pins. Delete the line to stop
the prompt.
:::

### Approval and deferral for fork PRs

Two rules apply to a PR from a fork, and to no other PR:

- **A Playwright integration run waits for approval.** A `CS3D_REF` line asks the shared
  self-hosted runner to build and execute CS3D code, so the run pauses on the
  `cs3d-integration` environment until one of the named reviewers approves that specific run.
  The Netlify deploy preview does not wait: it runs on Netlify's servers, which run the code of
  a fork PR in any case.
- **A PR that changes a CI-defining file does not run Playwright until it is merged.** The
  paths are `.github/`, `.scripts/`, `pnpm-workspace.yaml`, `preinstall.js`, any root
  pnpmfile, and every `.npmrc` in the workspace. `package.json` and `pnpm-lock.yaml` are
  not on the list, so a fork PR that adds a dependency or moves a module between workspace
  packages runs Playwright as usual; changes to the root `package.json` and
  `pnpm-lock.yaml` still need a code owner's review before merge.

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

This updates the packages that the cornerstone3D monorepo releases together (adapters, ai,
core, dicom-image-loader, labelmap-interpolation, metadata, nifti-volume-loader,
polymorphic-segmentation, tools, utils). It does not touch the codec packages or
`calculate-suv`, which carry their own version lines.

The script stops with an error when it finds an `@cornerstonejs/*` dependency that is in
neither group. A package it does not recognise is a question it cannot answer: it would
either leave that package behind at the old version, or ask npm for a release that does not
exist. Add the new package to `CS3D_PACKAGES` or to `INDEPENDENT_PACKAGES` in
`.scripts/cs3d-set-version.mjs`.

# OHIF ↔ CS3D integration workflows

This document describes the automated integration flow that consumes CS3D tarball release assets and opens/updates OHIF PRs for testing.

## Dependencies rewritten

Only **@cornerstonejs/** packages that have a matching release asset are rewritten. Asset filenames follow `cornerstonejs-<pkg>-<version>.tgz` (e.g. `cornerstonejs-core-4.18.5.tgz` → `@cornerstonejs/core`). The script updates:

- **dependencies**, **peerDependencies**, **optionalDependencies** in every `package.json` under the repo (excluding `libs/@cornerstonejs`)
- **resolutions** in the root `package.json`

Other @cornerstonejs packages (e.g. codec-*, calculate-suv) that are not in the CS3D release are left unchanged.

## Allowed file changes by mode

| Mode | Allowed to change |
|------|-------------------|
| **integration-only** | Only: any `package.json`, `yarn.lock` / `package-lock.json` / `bun.lock`, `.github/cs3d-integration.json`. Any other changed file fails verification. |
| **paired-change** / **merged-refresh** | Same manifest/lockfile/metadata changes; **in addition**, other source files may change (e.g. human OHIF edits). Automation only touches deps, lockfile, and metadata. |

In all modes, **CS3D dependency values** must point only to trusted release asset URLs (default: `https://github.com/<CS3D_TRUSTED_REPO>/releases/download/...`).

## Secrets required

| Secret | Purpose |
|--------|--------|
| **GH_TOKEN** or **GITHUB_TOKEN** | Used to fetch release assets from the CS3D repo and to create/update branches and PRs in this repo. Default `github.token` is sufficient for same-repo; use a PAT or app token if you need to read releases from another repo. |

No extra secrets are required if CS3D is public and the workflow runs in the OHIF repo with default `GITHUB_TOKEN`.

## How to trigger

1. **From CS3D (automatic)**  
   When CS3D runs its integration workflow, it sends a `repository_dispatch` to this repo with:
   - **Event type:** `cs3d-integration` (or `cs3d_integration_requested` / `cs3d_merged_update` if CS3D is updated to send those).
   - **Payload:** `release_tag`, `source_repository`, `mode`, and (for PR) `cs3d_pr_number`, `cs3d_head_sha` or (for merged) `cs3d_merged_version`, `cs3d_merged_sha`.

2. **Manual trigger**  
   Use the GitHub Actions UI: **Run workflow** on **OHIF CS3D integration**, then choose **repository_dispatch** and enter a JSON **Payload** (e.g. event type and client_payload). Or use the API:

   ```bash
   curl -X POST -H "Authorization: token $TOKEN" \
     -H "Accept: application/vnd.github.v3+json" \
     "https://api.github.com/repos/OWNER/OHIF_REPO/dispatches" \
     -d '{"event_type":"cs3d-integration","client_payload":{"mode":"integration-only","release_tag":"cs3d-pr-123-abc1234","source_repository":"cornerstonejs/cornerstone3D","cs3d_pr_number":123,"cs3d_head_sha":"abc1234..."}}'
   ```

## How to test locally

### Recommended: `install:cs3d` (one command from a PR URL)

To point OHIF at the latest CS3D prerelease for a specific PR, run:

```bash
export GH_TOKEN=your_github_pat   # required for GitHub API to resolve the release
bun run install:cs3d -- https://github.com/cornerstonejs/cornerstone3D/pull/2648
```

This script:

1. Parses the PR URL to get repo and PR number.
2. Fetches the repo’s releases and finds the **latest** prerelease whose tag matches `cs3d-pr-<PR number>-*`.
3. Fails with a clear message if no such release exists (e.g. the PR doesn’t have the `ohif-integration` label or the CS3D workflow hasn’t run yet).
4. Updates all `@cornerstonejs/*` dependency entries and root `resolutions` to the tarball URLs from that release.
5. Writes `.github/cs3d-integration.json` with metadata.
6. Runs `bun run install:update-lockfile` to refresh the lockfile.

After it succeeds, run the viewer as usual (e.g. `yarn dev`). To revert to published CS3D versions, restore `package.json` and lockfile from git and run `yarn install` again.

### Manual: update deps from a known release tag

If you already have a release tag (e.g. from [CS3D Releases](https://github.com/cornerstonejs/cornerstone3D/releases)):

```bash
export GH_TOKEN=your_github_token
node .github/scripts/update-cs3d-deps-from-assets.mjs \
  --release-tag cs3d-pr-123-abc1234 \
  --repo cornerstonejs/cornerstone3D \
  --mode integration-only \
  --cs3d-pr 123 \
  --cs3d-sha abc1234567890
yarn install
node .github/scripts/verify-cs3d-integration-diff.mjs --mode integration-only
```

### Verify diff only

After making changes, to ensure only allowed files changed:

```bash
CS3D_TRUSTED_REPO=cornerstonejs/cornerstone3D node .github/scripts/verify-cs3d-integration-diff.mjs --mode integration-only
```

### Resolve merged branch (for merged-update flow)

```bash
node .github/scripts/update-open-cs3d-integration-prs.mjs --action merged-update
```

This prints the branch name (`bot/cs3d-merged`) and writes to `GITHUB_OUTPUT` if that env is set.

## Metadata file

`.github/cs3d-integration.json` is written by the update script and records:

```json
{
  "mode": "integration-only",
  "cs3dPr": 1234,
  "cs3dSha": "abcdef...",
  "releaseTag": "cs3d-pr-1234-abcdef1",
  "cs3dRepo": "cornerstonejs/cornerstone3D"
}
```

For merged-refresh, `cs3dMergedVersion` and `cs3dMergedSha` may be set instead of `cs3dPr` / `cs3dSha`.

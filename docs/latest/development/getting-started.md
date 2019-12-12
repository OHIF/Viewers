# Getting Started

## Setup

### Fork & Clone

If you intend to contribute back changes, or if you would like to pull updates
we make to the OHIF Viewer, then follow these steps:

- [Fork][fork-a-repo] the [OHIF/Viewers][ohif-viewers-repo] repository
- [Create a local clone][clone-a-repo] of your fork
  - `git clone https://github.com/YOUR-USERNAME/Viewers`
- Add OHIF/Viewers as a [remote repository][add-remote-repo] labled `upstream`
  - Navigate to the cloned project's directory
  - `git remote add upstream https://github.com/OHIF/Viewers.git`

With this setup, you can now [sync your fork][sync-changes] to keep it
up-to-date with the upstream (original) repository. This is called a "Triangular
Workflow" and is common for Open Source projects. The GitHub blog has a [good
graphic that illustrates this setup][triangular-workflow].

### Private

Alternatively, if you intend to use the OHIF Viewer as a starting point, and you
aren't as concerned with syncing updates, then follow these steps:

1. Navigate to the [OHIF/Viewers][ohif-viewers] repository
2. Click `Clone or download`, and then `Download ZIP`
3. Use the contents of the `.zip` file as a starting point for your viewer

> NOTE: It is still possible to sync changes using this approach. However,
> submitting pull requests for fixes and features are best done with the
> separate, forked repository setup described in "Fork & Clone"

## Developing

### Requirements

- [Node.js & NPM](https://nodejs.org/en/)
- [Yarn](https://yarnpkg.com/en/)
- Yarn workspaces should be enabled:
  - `yarn config set workspaces-experimental true`

### Kick the tires

Navigate to the root of the project's directory in your terminal and run the
following commands:

```bash
# Restore dependencies
yarn install

# Start local development server
yarn run dev
```

You should see the following output:

```bash
@ohif/viewer: i ｢wds｣: Project is running at http://localhost:3000/
@ohif/viewer: i ｢wds｣: webpack output is served from /
@ohif/viewer: i ｢wds｣: Content not from webpack is served from D:\code\ohif\Viewers\platform\viewer
@ohif/viewer: i ｢wds｣: 404s will fallback to /index.html

# And a list of all generated files
```

### 🎉 Celebrate 🎉

<center>
  <img alt="development server hosted app" src="/assets/img/loading-study.gif" />
  <i>Our app, hosted by the development server</i>
</center>

### Building for Production

> More comprehensive guides for building and publishing can be found in our
> [deployment docs](./../deployment/index.md)

```bash
# Build static assets to host a PWA
yarn run build

# Build packaged output (script-tag use)
yarn run build:package
```

## Troubleshooting

- If you receive a _"No Studies Found"_ message and do not see your studies, try
  changing the Study Date filters to a wider range.
- If you see a 'Loading' message which never resolves, check your browser
  JavaScript console inside the Developer Tools to identify any errors.

<!--
  Links
  -->

<!-- prettier-ignore-start -->
[fork-a-repo]: https://help.github.com/en/articles/fork-a-repo
[clone-a-repo]: https://help.github.com/en/articles/fork-a-repo#step-2-create-a-local-clone-of-your-fork
[add-remote-repo]: https://help.github.com/en/articles/fork-a-repo#step-3-configure-git-to-sync-your-fork-with-the-original-spoon-knife-repository
[sync-changes]: https://help.github.com/en/articles/syncing-a-fork
[triangular-workflow]: https://github.blog/2015-07-29-git-2-5-including-multiple-worktrees-and-triangular-workflows/#improved-support-for-triangular-workflows
[ohif-viewers-repo]: https://github.com/OHIF/Viewers
[ohif-viewers]: https://github.com/OHIF/Viewers
<!-- prettier-ignore-end -->

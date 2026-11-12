---
sidebar_position: 9
sidebar_label: Local Linking
title: Local Library Linking
summary: Brief introduction to the concept of local linking for library development in OHIF, explaining how to test libraries in application context before publishing, with reference to Cornerstonejs linking documentation.
---

# Introduction

Local linking allows you to develop and test a library in the context of an application before it's published or when you encounter
a bug that you suspect is related to a library. With Yarn, this can be achieved through the yarn link command.

You can take a look at the Cornerstonejs tutorial for linking https://www.cornerstonejs.org/docs/contribute/linking

## Linking with `bun`

The [instructions](#introduction) above describe how to use `yarn` for local linking. Some use `bun` for day-to-day
code linking and execution. The method to link locally using `bun` differs slightly.

:::tip

Linking locally with `bun` provides for running the [playwright tests](./playwright-testing.md) locally so as to include (and test) local changes from Cornerstone3D!

:::

In the local Cornerstone3D, simply replace `yarn` with `bun` for each of the commands. For example, in `cornerstone/packages/core` the following would be done.

```
# In cornerstone/packages/core
bun unlink
bun link
bun dev
```

In OHIF, edit the root `package.json` file to include the cornerstone3D packages to link and add them to the `resolutions`.

For example here is a snippet of the `package.json` file linking cornerstone core and tools locally. Add whichever
cornerstone packages to link locally in the `resolutions`.

```
  ...
  "resolutions": {
    "commander": "8.3.0",
    "path-to-regexp": "0.1.12",
    "@cornerstonejs/core": "link:@cornerstonejs/core",
    "@cornerstonejs/tools": "link:@cornerstonejs/tools",
    ...
  },
  ...
```

In OHIF, run `bun install -f` and then run OHIF using either `bun dev` or `bun dev:fast`.

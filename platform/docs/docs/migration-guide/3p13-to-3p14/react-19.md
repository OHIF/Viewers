---
sidebar_position: 2
sidebar_label: React 19
title: React 19 required
---

# React 19 required

3.14 upgrades the monorepo to **React 19.2.7**.

If you deploy the shipped OHIF viewer as-is, this is invisible — the app bundles its
own React. It matters in two cases: you consume OHIF's published packages from npm,
or you maintain a third-party extension or mode.

## `@ohif/ui-next` now declares React as a peer dependency

**Before (3.13):**

```json
"dependencies": {
  "react": "18.3.1",
  "react-dom": "18.3.1"
}
```

**After (3.14):**

```json
"peerDependencies": {
  "react": "^19.2.7",
  "react-dom": "^19.2.7"
}
```

With OHIF 3.14, your application must supply React itself, because `@ohif/ui-next` no
longer installs a copy of its own. A peer dependency states a requirement on your
project — it does not deliver the package to you.

This is what keeps a **single React instance** on the page. Two copies of React have
separate internal state: hooks throw `Invalid hook call`, and context created by one
copy is invisible to components rendered by the other.

**What to do:** upgrade your application to React 19.2.7 or newer. Any 19.x at or above
that version satisfies the range.

## Extensions and modes require React 19

Every OHIF extension and mode declares `react` and `react-dom` 19.2.7 as peer
dependencies. A third-party extension built against React 18 must be upgraded before it
will work with 3.14.

## UMD builds require a React 19 host at runtime

OHIF's UMD artifacts that externalize React (notably `@ohif/ui-next`) are compiled with
the React Compiler, and the compiled output reads `useMemoCache` off the host's React.
That API exists only in React 19.

This failure surfaces at **runtime, not install time** — a React 18 host loads the
bundle and breaks when a compiled component first renders, with no package-manager
warning beforehand. If you load OHIF UMD bundles against a global `React`, confirm that
global is React 19 before upgrading.

## React 19 removals that affect extension code

React 19 removed a number of long-deprecated APIs. The ones most likely to appear in
extension or mode code:

| Removed in React 19 | Use instead |
| --- | --- |
| `ReactDOM.render`, `ReactDOM.hydrate` | `createRoot`, `hydrateRoot` |
| `ReactDOM.unmountComponentAtNode` | `root.unmount()` |
| `findDOMNode` | refs |
| runtime `propTypes` (silently ignored) | TypeScript types |
| `defaultProps` on function components | default parameter values |
| string refs, legacy context | callback or object refs, `createContext` |

`forwardRef` is **not** removed, but it is no longer necessary: React 19 function
components accept `ref` as an ordinary prop. OHIF's own components were converted, and
extension code can be converted at your convenience.

See React's [version 19 upgrade guide](https://react.dev/blog/2024/04/25/react-19-upgrade-guide)
for the complete list.

## TypeScript types

OHIF moves to `@types/react` 19.2.17 and `@types/react-dom` 19.2.3. If you maintain
TypeScript extension code, `types-react-codemod`'s `preset-19` handles the mechanical
changes — chiefly that `useRef()` now requires an argument, and `ReactElement` generic
defaults changed:

```bash
npx types-react-codemod@latest preset-19 ./src
```

## A note on the React Compiler

3.14 enables the React Compiler across OHIF's own source and its published package
builds. It applies to OHIF's code, not to yours — a third-party extension is compiled by
its own build pipeline, so nothing is required of you here. If you want the same
automatic memoization in your extension, enable `babel-plugin-react-compiler` in your
own build.

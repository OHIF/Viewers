---
sidebar_position: 2
sidebar_label: Implementation
title: Runtime plugins — implementation requirements
summary: How OHIF implements runtime plugins — the descriptor, the order of the loader's checks, the shared packages, the plugin build template, integrity, the three loading paths, the audit records, the documentation, and the gate for contract v2.
---

# Runtime plugins — implementation requirements

**Prefix:** `RP` (runtime plugins), groups `RP-DESC`, `RP-ORDER`, `RP-SHARE`, `RP-BUILD`,
`RP-INTEG`, `RP-PATH`, `RP-AUDIT`, `RP-DOC`, and `RP-V2`.
**User requirements:** [Runtime plugins — requirements](./requirements.md).
**Status:** Draft. This is the recommended approach, and it can change.

---

## 1. Scope

This document states the **implementation requirements** of runtime plugins: how the work was
done, or the recommended approach. Each requirement cites the user requirements (`RP-LOAD`,
`RP-TRUST`, `RP-VER`, `RP-ID`, `RP-FAIL`) of the [requirements specification](./requirements.md)
that it satisfies. The definitions of that document apply here.

You can change this document freely when a better approach appears. Cite the user requirements
that each change continues to satisfy. A change that needs a change of a user requirement goes
into the requirements specification first, under the change rule of that document.

The loader is `platform/app/src/runtimeExtensionLoader.ts`. The generated
`platform/app/src/pluginImports.js` calls it; `platform/app/.rspack/writePluginImportsFile.js`
generates that file at build time.

---

## 2. Implementation requirements

### 2.1 The descriptor — `RP-DESC`

**RP-DESC-1**
An entry of `extensions` or `modes` in the app config shall be a descriptor when it is an object
with a string `packageName` and a string `importPath` (`isRuntimeDescriptor`). An entry of the
form `[descriptor, configuration]` shall be a descriptor with a configuration for the extension.
*Satisfies `RP-LOAD-1`.*

**RP-DESC-2**
A descriptor shall have these fields (`RuntimePluginDescriptor`). *Satisfies `RP-LOAD-1`,
`RP-LOAD-5`, `RP-TRUST-3`, `RP-VER-1`, `RP-ID-1`.*

| Field | Required | Meaning |
| --- | --- | --- |
| `packageName` | yes | The package name, which must equal the id of the extension or mode. |
| `importPath` | yes | An absolute `http(s)` URL, a `/rooted` path, or a path relative to `PUBLIC_URL`. |
| `globalName` | for a UMD bundle | The global that a UMD bundle sets. An ES module omits it. |
| `coreVersionRange` | no | A semver range that the viewer's version must satisfy, prereleases included. |
| `integrity` | for another origin | `sha256-`, `sha384-` or `sha512-`, then the base64 digest of the bundle. |
| `styles` | no | Stylesheet URLs, added to the document head. |

**RP-DESC-3**
The loader shall resolve `importPath`, and each `styles` entry, to an absolute URL against
`PUBLIC_URL` before it checks the URL. *Satisfies `RP-TRUST-2`.*

> A path such as `//evil.example.com/x.js` starts with `/`, so a check on the string would take it
> for a path on the viewer's own server. The browser reads it as an address on another site.
> Resolving it first gives `https://evil.example.com/x.js`, and the allowlist checks that origin.

**RP-DESC-4**
The loader shall treat a descriptor with `globalName` as UMD and one without it as ESM, and shall
fail, rather than try the other format, when the plugin is not where that format puts it.
*Satisfies `RP-LOAD-5`.*

> A UMD plugin is read from `window[globalName]` after the bundle runs, and an ESM plugin is the
> default export of the imported module. The loader never guesses `globalName` from `packageName`.
> `sharePlugin` puts compiled-in plugins on `window` under their package names, so a guess could
> find the wrong one.

> This is why a contract v2 descriptor differs from a contract v1 descriptor only by the absence
> of `globalName`: the descriptor needs no new field.

**RP-DESC-5**
IF the object that `RP-DESC-4` finds, `window[globalName]` or the module's default export, has a
`default` property with an `id`, THEN the loader shall take that `default` as the plugin.
*Satisfies `RP-LOAD-2`, `RP-VER-6`.*

> A bundle built from the current template puts its whole module on the global (`RP-BUILD-1`), so
> its plugin is `default`. A bundle built with `output.library.export: 'default'` puts the plugin
> there directly. The loader accepts both.

### 2.2 The order of loading and checking — `RP-ORDER`

**RP-ORDER-1**
The generated loader shall load each list in two phases: every compiled-in plugin first, then
every descriptor (`loadInPhases`). Within a phase, the entries shall load in parallel, and the
results shall keep the order of the list. *Satisfies `RP-LOAD-3`, `RP-VER-6`.*

> A UMD runtime plugin reads its dependencies from `window` once, when its file runs. The
> compiled-in plugins in the same list must therefore have shared themselves (`RP-SHARE-5`) by
> then.

**RP-ORDER-2**
The viewer shall load every extension before it loads any mode (`appInit.js`). *Satisfies
`RP-LOAD-3`.*

**RP-ORDER-3**
`loadRuntimeDescriptor` shall make its decisions in this order, and stop at the first refusal:
1. a package name already loaded returns the plugin loaded before;
2. a package name that is also a compiled-in plugin is refused (`duplicate-of-built-in`);
3. `importPath` is resolved (`RP-DESC-3`);
4. an origin that is not allowed is refused (`refused-origin`);
5. a viewer version outside `coreVersionRange` is refused (`version-mismatch`);
6. the shared packages are assigned to `window` (`RP-SHARE-2`);
7. a bundle on another origin is fetched and checked against `integrity` (`RP-INTEG-1`);
8. the bundle is imported, and the plugin is taken from it (`RP-DESC-4`, `RP-DESC-5`);
9. a plugin whose `id` differs from `packageName` is refused (`import-error`);
10. the stylesheets are added (`RP-PATH-3` applies to each);
11. the plugin is kept under its package name.

*Satisfies `RP-LOAD-4`, `RP-TRUST-2`, `RP-TRUST-3`, `RP-TRUST-4`, `RP-VER-1`, `RP-ID-1`,
`RP-ID-2`.*

> Steps 2, 4 and 5 come before anything is downloaded, so a refused descriptor fetches nothing,
> not even the shared packages.

**RP-ORDER-4**
`loadRuntimeDescriptor` shall never throw. On a refusal or an error, it shall return `null` and
record the reason (`RP-AUDIT-1`). *Satisfies `RP-FAIL-1`.*

> The extension manager catches each extension's registration error, and `appInit` skips a mode
> that is `null`, so one bad plugin cannot stop the viewer.

**RP-ORDER-5**
WHEN a compiled-in mode names a runtime-loaded extension in `extensionDependencies`, the
generated loader shall resolve the bare package name to the plugin kept by `RP-ORDER-3` step 11
(`resolveRuntimeModule`). *Satisfies `RP-LOAD-3`.*

### 2.3 The shared packages — `RP-SHARE`

**RP-SHARE-1**
`hostSharedPackages` in `.rspack/pluginExternals.js` shall be the list of shared packages, and
`platform/app/src/runtimeShared.ts` shall import each one as a namespace and assign it to
`window` under its full package name. *Satisfies `RP-VER-2`.*

> The configuration reference lists the packages (`RP-DOC-2`). A namespace import gives a plugin
> both the named exports and the default interop, so `import React from 'react'` and
> `import { useState } from 'react'` both work.

**RP-SHARE-2**
The viewer shall load `runtimeShared.ts` just before it fetches the first runtime plugin
(`shareHostPackages`), and not at start. *Satisfies `RP-VER-2`.*

> A viewer with no runtime plugins then never downloads it. Importing it at start put the
> Cornerstone extension and its libraries into the first scripts of every deployment.

**RP-SHARE-3**
`platform/app/src/runtimeShared.test.js` shall fail when `runtimeShared.ts` and
`hostSharedPackages` differ, when a shared package is not also a build external, or when a
published SDK package (`publishedSdkPackages`) is not shared. *Satisfies `RP-VER-2`, `RP-VER-4`.*

**RP-SHARE-4**
`runtimeShared.test.js` shall fail when the installed major version (for a 0.x package, the
minor) of a shared package from outside OHIF differs from
`platform/create-ohif/host-shared-majors.json`. *Satisfies `RP-VER-3`, `RP-VER-5`.*

> The test cannot pass until the majors file changes, and the change to that file is the cue for
> the migration guide entry and the shared package table (`RP-DOC-2`, `RP-DOC-3`). `create-ohif`
> sets a plugin's peer ranges from the same file. An `@ohif/` package has no entry: it is
> versioned with the viewer.

**RP-SHARE-5**
The generated loader shall put each compiled-in extension and mode on `window` under its package
name, as its whole module, once it has loaded (`sharePlugin`). It shall never overwrite an
existing global. *Satisfies `RP-VER-6`.*

### 2.4 The plugin build — `RP-BUILD`

**RP-BUILD-1**
The template's `.rspack/rspack.prod.js` shall build a single UMD file with
`output.library = { name: pkg.name, type: 'umd' }`, so that the global holds the plugin's whole
module: the extension or mode as `default`, plus every named export. *Satisfies `RP-LOAD-2`,
`RP-VER-6`.*

> A compiled-in plugin's global holds its whole module too (`RP-SHARE-5`), so another plugin reads
> the named exports of either the same way.

**RP-BUILD-2**
The template's build shall leave out of the bundle every package that `.rspack/pluginExternals.js`
lists, and read each one from `window` at runtime. *Satisfies `RP-VER-2`.*

> The list matches more than the viewer shares: every `@cornerstonejs/*` package and `vtk.js`,
> not only Cornerstone3D's core and tools. That is a known contract v1 gap (open question 4 of
> the requirements specification).

**RP-BUILD-3**
The template's build shall emit one chunk, and inject the extension's CSS from the bundle itself
rather than as a separate stylesheet. *Satisfies `RP-LOAD-1`, `RP-LOAD-2`.*

> A separate stylesheet would stay unloaded whenever the viewer bundles the prebuilt file.

**RP-BUILD-4**
`create-ohif migrate` shall replace a plugin's build configuration with the template's.
*Satisfies `RP-LOAD-2`.*

### 2.5 Integrity — `RP-INTEG`

**RP-INTEG-1**
For a bundle on another origin, the loader shall fetch the bundle with CORS, hash the bytes with
the algorithm that `integrity` names, compare the base64 digest, and import the checked bytes
through a blob URL that it revokes afterwards. *Satisfies `RP-TRUST-3`, `RP-TRUST-4`.*

> The fetch needs the plugin's origin in the Content-Security-Policy's `connect-src`, and the
> import needs `blob:` in `script-src`. The plugin's server must send CORS headers. The deployment
> guide states the directives.

**RP-INTEG-2**
IF `integrity` is malformed, or the digests differ, THEN the loader shall refuse the plugin with
the status `integrity-failed`. *Satisfies `RP-TRUST-4`.*

**RP-INTEG-3**
For a bundle on the viewer's own origin, the loader shall import the bundle directly, without a
digest check. *Satisfies `RP-TRUST-1`.*

### 2.6 The loading paths — `RP-PATH`

**RP-PATH-1**
The three paths that load plugin code shall apply these checks. *Satisfies `RP-TRUST-5`.*

| Path | Origin allowed | Digest |
| --- | --- | --- |
| An `importPath` in `pluginConfig.json`, compiled into the viewer | not checked | not checked |
| A URL string in `extensions` or `modes`, or passed to `appConfig.peerImport`, that is not declared in `pluginConfig.json` (`loadExternalModule`) | checked | not checked |
| A descriptor | checked | required for another origin |

> A build-time `importPath` changes only with a rebuild, the same trust as the viewer's own
> source. On the second path the allowed origin is the trust decision: there is no descriptor to
> carry a digest.

**RP-PATH-2**
On the second path, the loader shall accept only a URL, and IF it is given a bare name that no
compiled-in plugin declares, THEN it shall fail with an error that says how to declare it.
*Satisfies `RP-TRUST-2`, `RP-FAIL-2`.*

**RP-PATH-3**
The allowed origins shall be the viewer's own origin plus `runtimePluginOrigins` from the app
config. `window.__ohif.runtimePluginOrigins`, which the viewer sets at start so that an app
config written as a function can carry the list, shall take precedence over
`window.config.runtimePluginOrigins`. The comparison shall be `isOriginAllowed`
(`platform/app/src/utils/isOriginAllowed.ts`), shared with the dynamic config gate. *Satisfies
`RP-TRUST-1`, `RP-TRUST-2`.*

> A full-URL entry allows that URL's origin, the port is part of the origin, and a malformed entry
> is skipped rather than fatal.

### 2.7 The audit records — `RP-AUDIT`

**RP-AUDIT-1**
Each attempt to load a descriptor, other than one for a package already loaded, shall add a record
to `window.__ohif.runtimePlugins`, with `packageName`, `kind`, `importPath`, `resolvedUrl`,
`status`, `hostVersion`, `requiredRange`, `format`, `error`, `durationMs` and `timestamp`.
*Satisfies `RP-FAIL-2`.*

> `hostVersion` is the viewer's `version.txt` value. A record leaves out the fields that don't
> apply: a `duplicate-of-built-in` record has no `resolvedUrl` or `durationMs`. The second path of
> `RP-PATH-1` also adds a record, but only when the load fails, and with no `kind`, since that path
> isn't told which list the URL came from.

**RP-AUDIT-2**
`status` shall be one of `loaded`, `refused-origin`, `integrity-failed`, `version-mismatch`,
`import-error`, `registration-error` and `duplicate-of-built-in`. *Satisfies `RP-FAIL-2`.*

**RP-AUDIT-3**
After the extensions register, the viewer shall change the status of each runtime extension that
loaded but did not register to `registration-error` (`reconcileRuntimeRegistrations`).
*Satisfies `RP-FAIL-2`, `RP-FAIL-3`.*

**RP-AUDIT-4**
WHEN a compiled-in extension fails to register as its mode opens, the viewer shall add a record
with `importPath: '(built-in)'` and the status `registration-error` (`recordRegistrationError`).
*Satisfies `RP-FAIL-5`.*

**RP-AUDIT-5**
Once the UI has mounted, the viewer shall show one notification for each record that is not
`loaded` and not yet shown, which does not close by itself, and which names the plugin, the
status, the reason, the viewer's version and the required range
(`surfaceRuntimeExtensionFailures`). A `duplicate-of-built-in` record shall show as a warning,
and every other status as an error. *Satisfies `RP-FAIL-3`, `RP-FAIL-4`.*

### 2.8 Documentation — `RP-DOC`

**RP-DOC-1**
The configuration reference (`configuration/configurationFiles.md`, "Runtime Extensions and
Modes") shall describe the descriptor fields, the allowed origins, the checks of each loading
path, how to compute `integrity`, and the audit records. *Satisfies `RP-TRUST-5`.*

**RP-DOC-2**
The configuration reference ("Shared host packages") shall list the shared packages and, for each
from outside OHIF, the major version that a plugin must be built against. *Satisfies `RP-VER-3`.*

**RP-DOC-3**
A change that removes a shared package, or moves one from outside OHIF to a new major version,
shall add a migration guide entry in the same pull request. *Satisfies `RP-VER-5`.*

### 2.9 The gate for contract v2 — `RP-V2`

> `RP-V2-1` to `RP-V2-7` were boxes 1 to 7 of the gate in the former decision record
> `platform/app/.rspack/CONTRACT.md`, which this specification replaces, and `RP-V2-8` holds its
> non-goals. `RP-V2-1` to `RP-V2-7`
> must all hold before the `create-ohif` template's default output changes from contract v1 to
> contract v2. **Today the gate is closed:** `RP-V2-1` does not hold. These are conditions on
> changing the contract, so `RP-V2-4` and `RP-V2-5` satisfy no user requirement.

**RP-V2-1**
Before the template's default changes to contract v2, `@rslib/core` shall be at version 1.0 or
later, and a template plugin built with it shall produce an ES module that keeps its named
exports, plus a UMD fallback, with every shared package left as a bare import. *Satisfies
`RP-LOAD-5`.*

> **Current: does not hold.** rslib is before 1.0 (0.23.2 when the gate was written), and this
> repository does not depend on it. To check the bare imports, look for `from "react"` and the
> like in the emitted `.mjs`.

**RP-V2-2**
Before the template's default changes to contract v2, a way to generate an ES module shim for
each shared package shall be chosen and shown to work for every one, with output that is
byte-reproducible on CI and checked for staleness by `pnpm plugin doctor`. *Satisfies
`RP-VER-2`.*

> **Current: not started.** A shim re-exports the viewer's instance of one shared package under
> its own URL, and must name each export. The choice is between finding the exports by loading
> each package and finding them from its source, and it must cover packages that cannot load
> without a browser (jsdom or WebGL). The shim list is `.rspack/sharedModules.json`; the
> staleness check compares its `generatedFrom` versions with the installed ones. Until the gate
> opens, shims are prototype output (`RP-V2-8`).

**RP-V2-3**
Before the template's default changes to contract v2, the integrity approach for ES modules shall
be decided and recorded: the import map's `integrity` key with a published list of supported
browsers, a fetch and blob URL import by the loader, or a digest only for another origin with a
UMD fallback for browsers that lack support. *Satisfies `RP-TRUST-3`, `RP-TRUST-4`.*

> **Current: undecided.** Browser support must be checked when the decision is made. A plugin on
> the viewer's own origin keeps needing no digest, as in contract v1.

**RP-V2-4**
Before the template's default changes to contract v2, the Docker image shall substitute the
hashes of the viewer's inline scripts into its Content-Security-Policy, and an end-to-end test
shall start the image with the policy on.

> **Current: not started.** The import map is an inline script, so a policy without
> `'unsafe-inline'` needs its hash. The mechanism: the build writes `dist/csp-inline-hashes.json`,
> and the image puts those hashes in place of `__INLINE_SCRIPT_HASHES__` in `CSP_HEADER`
> (`.docker/Viewer-v3.x`).

**RP-V2-5**
Before the template's default changes to contract v2, the viewer's build shall emit the import
map tag deterministically: LF line endings, sorted, and with no timestamps.

> **Current: not applicable until `RP-V2-2` exists.** There is now one HTML build
> (`rsbuild.config.ts`), so this no longer needs two builds to agree.

**RP-V2-6**
Before the template's default changes to contract v2, the documentation shall describe both
formats and the migration, the `create-ohif` release notes shall announce the change and keep a
`--format umd` option for at least one more minor release line, a pinned GitHub Discussion shall
announce it, and the viewer shall log a message when a UMD plugin loads after the change.
*Satisfies `RP-LOAD-5`.*

> **Current: not started.** The descriptor change for a plugin author is only the removal of
> `globalName` (`RP-DESC-4`).

**RP-V2-7**
Before the template's default changes to contract v2, a runtime plugin shall be able to import
another runtime plugin as the instance that the loader registered, and an import from a package
that the plugin never declared shall be reported before the plugin leaves its repository.
*Satisfies `RP-LOAD-6`.*

> **Current: not designed.** The shared package list holds only the viewer's own packages, so it
> cannot cover another runtime plugin. A plugin that imports another bundles its own copy, and a
> library that both use for shared state ends up as two copies that don't see each other. Inside
> a monorepo, hoisted `node_modules` hides undeclared imports until the plugin builds on its own. Candidate approach, a proposal and not a decision:
>
> - `package.json` is the contract. `dependencies` are bundled; every `peerDependencies` name
>   stays a bare import.
> - The import map gives the browser a URL for each bare name: a shared package maps to its shim
>   (`RP-V2-2`), and a runtime plugin's package name maps to its descriptor's `importPath`, added
>   when the descriptor loads. An ES module runs its imports before itself, so the load order
>   needs no rule of its own.
> - `create-ohif migrate` and `pnpm plugin doctor` report an import from `src/` that is neither
>   declared nor shared, and a peer that neither the viewer nor another plugin provides.
>
> Browser support for import map entries added after the first module has loaded must be checked
> when this is designed.

**RP-V2-8**
Until the gate opens, the work toward contract v2 shall change no build output of the viewer:
the HTML template shall carry no import map, no package shall gain an ES module build, the
generated loader shall not change for contract v2, no production build shall use
`.rspack/sharedModules.json` or the shims, and the template's default shall stay UMD.
*Satisfies `RP-VER-4`.*

> These were the non-goals of the decision record. The app keeps its chunk format, with no
> `experiments.outputModule`. Shims under `platform/app/public/shared/` are gitignored prototype
> output. A prototype HTML template stays opt-in through the `HTML_TEMPLATE` environment variable.

---

## 3. Traceability

| Implementation group | User requirements |
| --- | --- |
| `RP-DESC` | `RP-LOAD-1`, `RP-LOAD-2`, `RP-LOAD-5`, `RP-TRUST-2`, `RP-TRUST-3`, `RP-VER-1`, `RP-VER-6`, `RP-ID-1` |
| `RP-ORDER` | `RP-LOAD-1`, `RP-LOAD-3`, `RP-LOAD-4`, `RP-TRUST-2`, `RP-TRUST-3`, `RP-TRUST-4`, `RP-VER-1`, `RP-VER-6`, `RP-ID-1`, `RP-ID-2`, `RP-FAIL-1` |
| `RP-SHARE` | `RP-VER-2`, `RP-VER-3`, `RP-VER-4`, `RP-VER-5`, `RP-VER-6` |
| `RP-BUILD` | `RP-LOAD-1`, `RP-LOAD-2`, `RP-VER-2`, `RP-VER-6` |
| `RP-INTEG` | `RP-TRUST-1`, `RP-TRUST-3`, `RP-TRUST-4` |
| `RP-PATH` | `RP-TRUST-1`, `RP-TRUST-2`, `RP-TRUST-5`, `RP-FAIL-2` |
| `RP-AUDIT` | `RP-FAIL-2`, `RP-FAIL-3`, `RP-FAIL-4`, `RP-FAIL-5` |
| `RP-DOC` | `RP-TRUST-5`, `RP-VER-3`, `RP-VER-5` |
| `RP-V2` | `RP-LOAD-5`, `RP-LOAD-6`, `RP-TRUST-3`, `RP-TRUST-4`, `RP-VER-2`, `RP-VER-4` |

## 4. Verification

| Implementation group | Verification |
| --- | --- |
| `RP-DESC` | `platform/app/src/runtimeExtensionLoader.test.js`: "strict globalName format discriminator", including a global that holds the whole module. |
| `RP-ORDER` | `runtimeExtensionLoader.test.js`: "loadInPhases", "Mode bare-name cache resolution", "a descriptor for a plugin declared in pluginConfig.json", "coreVersionRange gate", "id contract", "host-shared globals". `platform/app/src/__tests__/pluginImportsCodegen.test.js` for the generated loader. |
| `RP-SHARE` | `platform/app/src/runtimeShared.test.js`; `runtimeExtensionLoader.test.js`: "sharePlugin". |
| `RP-BUILD` | `platform/create-ohif/tests/scaffold.test.mjs` and `migrate.test.mjs`; `platform/create-ohif/scripts/scaffold-smoke.mjs` (builds a scaffolded plugin and checks its global); `scripts/verify-umd-global.mjs` (a built bundle in a browser reads every shared package from `window`). |
| `RP-INTEG` | `runtimeExtensionLoader.test.js`: "integrity (allowlisted cross-origin)". |
| `RP-PATH` | `runtimeExtensionLoader.test.js`: "loadExternalModule", "origin allowlist", "styles"; `platform/app/src/utils/isOriginAllowed.test.ts`. |
| `RP-AUDIT` | `runtimeExtensionLoader.test.js`: "kind", "loadExternalModule audit + failure surfacing". The notification itself: manual, in a running viewer. |
| `RP-DOC` | Review. `runtimeShared.test.js` fails until the majors file changes (`RP-SHARE-4`), which prompts `RP-DOC-2` and `RP-DOC-3`. |
| `RP-V2` | Review of each requirement's state when the gate is considered. |

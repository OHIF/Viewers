---
sidebar_position: 1
sidebar_label: Requirements (EARS)
title: Runtime plugins — requirements
summary: What a deployer and a plugin author can rely on when the viewer loads an extension or mode at runtime, without a rebuild — which code is allowed to run, which viewer versions and shared packages a plugin can count on, and how a failure shows.
---

# Runtime plugins — requirements

**Prefix:** `RP` (runtime plugins) — *proposed, not yet reserved in the specification register.*
**Source:** [OHIF/Viewers#6168](https://github.com/OHIF/Viewers/pull/6168) — the extensibility
redesign, which added runtime loading of extensions and modes.
**Status:** Draft, under review. This document holds the user requirements. The
[implementation specification](./implementation.md) holds the implementation requirements.
**Affects:** `@ohif/app`, `create-ohif`, the plugin build template, and the configuration and
deployment documentation.

---

## 1. Purpose

A deployment can add an extension or a mode to the viewer without rebuilding it: the app config
lists a **descriptor** that says where the plugin's bundle is, and the viewer loads it when it
starts. That makes the viewer an execution environment for code its builder never saw, so a
deployer and a plugin author both need to know what they can rely on:

- which code the viewer agrees to run, and what it checks first;
- which viewer versions and which shared packages a plugin can count on, and for how long;
- what happens, and what is shown, when a plugin cannot be loaded.

This specification states those guarantees. The descriptor fields and the shared package list
are a public contract: a plugin that is already built and published depends on them, so they
change only under the rules stated here.

## 2. Scope

### 2.1 How to read this specification

This document states the **user requirements** (§4): what a deployer or a plugin author must be
able to do, or must be able to determine, to use runtime plugins safely. A user requirement names
no class, file or algorithm. The [implementation specification](./implementation.md) states the
**implementation requirements**: how the work was done, or the recommended approach. Each
implementation requirement cites the user requirements that it satisfies.

You can change the implementation specification freely when a better approach appears. You change
this document in two cases only: a requirement describes the behaviour wrongly, or the intended
user-facing behaviour changes. An implementation that is inconvenient is never a reason to change
a user requirement.

### 2.2 In scope

- Loading an extension or a mode at runtime from a descriptor in the app config.
- The checks the viewer makes before it runs a plugin's code: origin, digest, viewer version,
  identity.
- The packages the viewer shares with runtime plugins, and the promise about their versions.
- How a plugin's bundle must be built so that the viewer can load it.
- How a load or registration failure is recorded and shown.
- The conditions for the next contract version (`RP-V2` in the implementation specification).

### 2.3 Out of scope

- Plugins compiled into the viewer through `pluginConfig.json`, except where they meet runtime
  plugins (`RP-LOAD-3`, `RP-LOAD-4`, `RP-VER-6`, `RP-FAIL-5`).
- Loading a whole app config from a `?configUrl=` link (`dangerouslyUseDynamicConfig`). That has
  its own gate, documented in the configuration reference.
- The Content-Security-Policy header of a deployment, beyond what a cross-origin plugin needs.
  The deployment guide covers it.
- Creating and migrating plugin packages with `create-ohif`, and publishing them to npm.

## 3. Definitions

**Deployer.** Whoever writes the app config of a deployment and serves the viewer.

**Plugin author.** Whoever writes and builds an extension or a mode.

**Compiled-in plugin.** An extension or mode declared in `pluginConfig.json` and built into the
viewer's own bundle.

**Runtime plugin.** An extension or mode that the viewer loads when it starts, from a bundle the
app config points at, without a rebuild of the viewer.

**Descriptor.** The entry in the app config's `extensions` or `modes` list that names a runtime
plugin and says where its bundle is and how to check it.

**Register.** Hand a loaded plugin to the viewer: an extension to the extension manager, and a
mode to the viewer's list of modes, after its `modeFactory` has run.

**Shared package.** A package that the viewer provides to runtime plugins from its own build, so
that every plugin uses the viewer's single instance instead of bundling a copy. React, the OHIF
SDK packages and Cornerstone3D's core and tools are examples.

**Allowed origin.** An origin from which the viewer agrees to load plugin code: the viewer's own
origin, and the origins the deployer lists.

**Digest.** A cryptographic hash of a bundle's exact bytes, written in the descriptor, against
which the viewer checks what it downloads.

**Plugin contract.** What a runtime plugin and the viewer agree on: the descriptor fields, the
format of the bundle, and the shared packages with their versions. It has a version number. A
change that breaks a plugin that is already built needs a new contract version.

**Contract v1.** The current contract. A runtime plugin is a UMD bundle. It reads each shared
package from a global that the viewer sets, named after the package.

**Contract v2.** The planned contract. A runtime plugin is an ES module. It imports each shared
package by name, and an import map that the viewer provides resolves the name. Contract v2 ships
only when the conditions of `RP-V2` hold. Until then, contract v1 is the contract.

---

## 4. User requirements

> Change these only if a requirement describes the behaviour wrongly, or if the intended
> user-facing behaviour changes.

### 4.1 Add a plugin without a rebuild — `RP-LOAD`

**RP-LOAD-1**
WHERE the app config lists a descriptor, the system shall load that extension or mode when the
viewer starts, without a rebuild of the viewer.

**RP-LOAD-2**
The system shall accept the same plugin package either as a compiled-in plugin or as a runtime
plugin, without a change to the package.

**RP-LOAD-3**
WHERE a compiled-in mode depends on an extension that a descriptor loads, the system shall
resolve that dependency to the runtime plugin.

**RP-LOAD-4**
IF a descriptor names a plugin that is also a compiled-in plugin, THEN the system shall use the
compiled-in plugin and not fetch the descriptor's bundle.

**RP-LOAD-5**
WHEN a plugin author moves a plugin from contract v1 to contract v2, the system shall require no
change to the plugin's descriptor other than removing `globalName` and pointing `importPath` at
the new bundle.

**RP-LOAD-6**
WHERE the plugin contract supports imports between runtime plugins, the system shall give a
runtime plugin that imports another runtime plugin the instance that the viewer registered.

> Not met by contract v1. A runtime plugin that imports another runtime plugin, such as a mode
> that imports named exports from its own extension, bundles its own copy of that plugin. A
> library that both use for shared state then exists twice. `RP-V2-7` states what contract v2
> must provide before it ships.

### 4.2 Only code the deployment trusts runs — `RP-TRUST`

**RP-TRUST-1**
The system shall load plugin code and plugin stylesheets from the viewer's own origin without
further configuration.

**RP-TRUST-2**
IF plugin code or a plugin stylesheet would come from an origin that is not an allowed origin,
THEN the system shall refuse it before fetching it.

**RP-TRUST-3**
IF a descriptor points at a bundle on another origin and gives no digest, THEN the system shall
refuse the plugin.

**RP-TRUST-4**
IF the bytes served for a descriptor's bundle do not match its digest, THEN the system shall not
run them.

**RP-TRUST-5**
The system shall enable the deployer to determine, for each way that plugin code can be loaded,
whether the origin is checked and whether a digest is required.

> Three paths load plugin code, and each is trusted differently:
>
> - A bundle named in `pluginConfig.json` is compiled into the viewer and has no checks.
> - A URL string in `extensions` or `modes`, or passed to `appConfig.peerImport`, has its origin
>   checked.
> - A descriptor has its origin checked, and needs a digest when it's on another origin.
>
> Only a descriptor has a field for a digest. So listing an origin in `runtimePluginOrigins` also
> lets that origin run code from a plain URL with no digest. This requirement makes sure the
> documentation says so.

### 4.3 Versions and shared packages — `RP-VER`

**RP-VER-1**
WHERE a descriptor states the viewer versions that the plugin supports, IF the running viewer's
version is outside them, THEN the system shall refuse the plugin before fetching it.

**RP-VER-2**
The system shall provide each runtime plugin with the viewer's own instance of every shared
package.

> A second copy of React, of the router or of the translation library does not see the viewer's
> state: hooks fail, links throw outside the viewer's router, and translations show their raw
> keys.

**RP-VER-3**
The system shall publish the list of shared packages and, for each shared package from outside
OHIF, the major version that a plugin must be built against.

**RP-VER-4**
WHILE a release implements a given contract version, the system shall provide every shared
package that earlier releases of that contract version provided.

**RP-VER-5**
IF a release removes a shared package, or moves a shared package from outside OHIF to a new major
version, THEN the system shall describe the change in that release's migration guide.

**RP-VER-6**
The system shall make each compiled-in extension and mode available to runtime plugins, with all
of its exports.

> This carries no compatibility promise: the exports of a compiled-in plugin can change between
> releases. An extension that the viewer loads only when a mode needs it is available only after
> it has loaded. The shared packages of `RP-VER-2` are the stable set.

### 4.4 Identity — `RP-ID`

**RP-ID-1**
IF the extension or mode that a bundle provides has an id that differs from the package name in
its descriptor, THEN the system shall refuse it.

**RP-ID-2**
The system shall load a runtime plugin with a given package name at most once.

### 4.5 Failures are contained and visible — `RP-FAIL`

**RP-FAIL-1**
IF a runtime plugin fails to load, or a runtime extension fails to register, THEN the system shall
start with the remaining plugins.

> A runtime mode that throws while it registers stops the viewer from starting (open question 7).

**RP-FAIL-2**
WHEN the system attempts to load a runtime plugin, it shall record the outcome, the plugin, the
viewer's version, and the version range the plugin requires.

**RP-FAIL-3**
IF a runtime plugin fails to load, or a runtime extension fails to register, THEN the system shall
show the user one notification that names the plugin and the reason.

**RP-FAIL-4**
IF the system skips a descriptor because the plugin is also a compiled-in plugin, THEN it shall
show a warning rather than an error.

> The viewer still works in that case: the compiled-in plugin is in use.

**RP-FAIL-5**
IF a compiled-in extension fails to register, THEN the system shall record and show the failure
as it does for a runtime plugin.

---

## 5. Implementation requirements

The [implementation specification](./implementation.md) holds the implementation requirements:
the groups `RP-DESC`, `RP-ORDER`, `RP-SHARE`, `RP-BUILD`, `RP-INTEG`, `RP-PATH`, `RP-AUDIT`,
`RP-DOC`, and `RP-V2`.

---

## 6. Open questions

| # | Question | State |
| --- | --- | --- |
| 1 | The prefix `RP` must go into §1 of the specification register (`specs/index.md`). | **Deferred.** The register is not on this branch. Add the prefix on a branch that holds the register. |
| 2 | Imports between runtime plugins (`RP-LOAD-6`). | **Deferred to contract v2.** `RP-V2-7` records what v2 must provide. Until then, a mode and its extension moved out of a fork need a hand-edited build, which `create-ohif migrate` overwrites. |
| 3 | Runtime extensions load in parallel. A runtime extension that imports another runtime extension can run first and find nothing. | **Deferred to contract v2.** An ES module runs its imports before itself, so the order needs no rule of its own (`RP-V2-7`). Extensions already load before modes, so a mode that imports its extension is not affected. |
| 4 | The plugin build leaves every `@cornerstonejs/*` package and `vtk.js` out of the bundle, but the viewer shares only Cornerstone3D's core and tools. | **Still open.** A known contract v1 gap, documented in the configuration reference. A plugin that imports another Cornerstone3D package must not rely on the viewer for it. |
| 5 | Should a plain URL string, with no descriptor, also need a digest? | **Resolved: no.** There's no descriptor to carry a digest, and the URLs that reach this path are ones the deployment chose. The allow list is the only trust check on this path, and `RP-TRUST-5` requires the documentation to say so. |
| 6 | How does a deployer tell which contract version a viewer release implements? | **Still open.** Only the documentation says so today. Contract v1 starts with 3.14, and earlier releases have no runtime plugin contract. |
| 7 | A runtime mode whose `modeFactory` or `getCommandsModule` throws stops the viewer from starting, because `appInit` registers modes without catching errors. | **Still open.** Catching the error in that loop, and recording it with `recordRegistrationError(id, error, 'mode')`, would let `RP-FAIL-1` cover modes too. |

## 7. Traceability

| Requirement group | Anchored in |
| --- | --- |
| `RP-LOAD` | OHIF/Viewers#6168: runtime descriptors; the descriptor shape kept compatible with contract v2. |
| `RP-TRUST` | OHIF/Viewers#6168: the origin allowlist (`runtimePluginOrigins`) and `integrity`; the three loading paths. |
| `RP-VER` | OHIF/Viewers#6168: `coreVersionRange`; the shared package list and its freeze rule; the check of each shared third-party major against `platform/create-ohif/host-shared-majors.json`. |
| `RP-ID` | OHIF/Viewers#6168: the rule that an extension's or mode's id equals its package name. |
| `RP-FAIL` | OHIF/Viewers#6168: the audit records and the failure notifications, including the record for a compiled-in extension that fails to register. |
| `RP-V2` | The former decision record `platform/app/.rspack/CONTRACT.md`, which this specification replaces. |

## 8. Verification

| Requirement group | Primary verification |
| --- | --- |
| `RP-LOAD` | Unit: `platform/app/src/runtimeExtensionLoader.test.js` (format switch, cache resolution for a compiled-in mode, a descriptor for a compiled-in plugin, load phases). Manual: a scaffolded plugin loaded compiled in and at runtime. `RP-LOAD-6` is not verifiable until contract v2. |
| `RP-TRUST` | Unit: `runtimeExtensionLoader.test.js` (origin allowlist, integrity, styles, URL fallthrough), `platform/app/src/utils/isOriginAllowed.test.ts`. Review: the configuration reference states the checks of each path (`RP-TRUST-5`). |
| `RP-VER` | Unit: `runtimeExtensionLoader.test.js` (version range gate), `platform/app/src/runtimeShared.test.js` (the shared list, its externals, the third-party majors). Review: the shared package table and the migration guide (`RP-VER-3`, `RP-VER-5`). Browser: `scripts/verify-umd-global.mjs` (a built bundle reads every shared package from the viewer). |
| `RP-ID` | Unit: `runtimeExtensionLoader.test.js` (id contract, idempotent load). |
| `RP-FAIL` | Unit: `runtimeExtensionLoader.test.js` (audit records, registration errors, notifications). Manual: the notification in a running viewer, since notifications are suppressed in the test environment. |

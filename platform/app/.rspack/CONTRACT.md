# Third-party plugin contract

This file is the decision record for the third-party plugin loading contract. It
is referenced by shipped code (`platform/app/src/runtimeExtensionLoader.ts`, see
the `globalName` doc comment) as the home of the loader behavior matrix.

Scope of this record (WS10.8): the **rslib adoption gate** that must clear before
the third-party plugin contract flips from UMD (v1) to ESM + import map (v2), and
the explicit **non-goals** of the v2 preparation work. The v2 shim-generation,
import-map injection, and CSP-hash machinery (WS10.1–WS10.6) is intentionally NOT
built; this document only records the gate and the shipped v1 shape.

---

## v1 UMD descriptor path — SHIPPED, and the contract until the gate clears

The v1 contract shipped in WS7. It is the live contract today and stays the
contract until every gate box below is checked.

- Runtime descriptors are `{ packageName, importPath, globalName?, coreVersionRange?,
  integrity?, styles? }` (`RuntimeExtensionDescriptor` in
  `platform/app/src/runtimeExtensionLoader.ts`).
- **Strict format discriminator (C3-strict, shipped).** `globalName` presence IS
  the format discriminator, with no fallback chain:
  - `globalName` present ⇒ **UMD**: loader returns `window[globalName]`
    (normally `globalName === packageName`, matching the plugin build's
    `output.library.name`). If the global is absent after the script evaluates,
    the load fails — it does not fall back to `packageName` or to `.default`.
  - `globalName` absent ⇒ **ESM**: loader returns the `import()` namespace's
    `.default`.
  The loader NEVER defaults `globalName` to `packageName`. This is the binding
  "no globalName defaulting" constraint that WS10.7 placed on WS7, and it is what
  makes the descriptor shape forward-compatible with v2 at zero schema cost — a
  v2 (ESM) plugin's descriptor differs from a v1 (UMD) plugin's by exactly the
  presence of `globalName`.
- The audit record `window.__ohif.runtimeExtensions[]` carries
  `format: 'umd' | 'esm'` derived from that discriminator
  (`runtimeExtensionLoader.ts`), giving v2-rollout telemetry for free.
- Per-package UMD builds stay raw rspack for v1
  (`platform/core/.rspack/rspack.prod.js` emits `library: { type: 'umd' }`;
  `platform/core` ships `main: dist/ohif-core.umd.js`). `@rslib/core` is NOT a
  dependency of this repo.

---

## Gate: flipping the create-ohif template default to ESM

ALL boxes are required before `platform/create-ohif` changes its default output
format from UMD to ESM + import map. **Status today: NOT adopted — box 1 is
false, so the gate is closed.** `@rslib/core` is pre-1.0 (0.23.2 at the time of
this record), so contract v2 (ESM + import map) CANNOT ship: rslib's dual-output
and named-export-preservation guarantees are not API-stable below 1.0, and this
repo does not depend on rslib at all today.

- [ ] **1. rslib >= 1.0.0 stable.** Scaffold a template plugin, build it with
  rslib, confirm dual output — ESM preserving named exports + UMD fallback —
  where the ESM build leaves every `sharedModules.json` specifier as a bare
  import (verify the emitted `.mjs` contains `from "react"` etc.).
  **Current: FALSE.** rslib is pre-1.0 (0.23.2) and is not a dependency. This box
  alone blocks the flip.
- [ ] **2. Shim experiment concluded.** The WS10.3-chosen shim-generation
  mechanism meets its success criteria for ALL 11 shared modules (including
  whatever jsdom/WebGL findings WS10.1 records); `sharedModules.json`
  regeneration is byte-reproducible on CI and the staleness check
  (`generatedFrom` vs installed versions) is wired into `pnpm plugin doctor`.
  **Current: NOT STARTED — WS10.1–WS10.3 machinery is out of scope this run.**
- [ ] **3. Import-map integrity decision RECORDED.** Choose one and record it:
  (a) require the import map `integrity` key and publish the minimum-browser
  matrix — support MUST be re-verified at gate time against caniuse/MDN, do not
  trust any snapshot in this document; or (b) loader-side fetch+hash+Blob-URL
  import for cross-origin ESM; or (c) integrity enforced only for cross-origin
  descriptors with UMD fallback for non-supporting browsers. Whichever is chosen,
  same-origin `/plugins/` deployments stay integrity-optional as in v1.
  **Current: UNDECIDED — deferred to gate time; browser coverage must be
  re-verified then, not now.**
- [ ] **4. CSP handshake landed.** `dist/csp-inline-hashes.json` →
  `CSP_HEADER __INLINE_SCRIPT_HASHES__` substitution shipped in
  `.docker/Viewer-v3.x` (deployment workstream) and covered by an e2e smoke that
  boots the container with CSP on. **Current: NOT STARTED — WS10.6 machinery is
  out of scope this run.**
- [ ] **5. Pipeline parity proof.** Historically this required both HTML
  pipelines to emit an identical import-map tag. After the single-rsbuild
  cutover there is now ONE HTML pipeline (`rsbuild.config.ts`; `rspack.pwa.js` is
  gone). This box reduces to: the shared import-map helper emits a deterministic
  (LF, sorted, no timestamps) tag, byte-reproducible across builds.
  **Current: N/A until box 2 exists — no import-map helper is built this run.**
- [ ] **6. UMD deprecation comms plan executed BEFORE the flip.** Docs page
  describing both formats and migration (plugin-author action: rebuild with the
  new template config — the descriptor change is only "delete `globalName`");
  create-ohif release notes announcing the default change with `--format umd`
  retained for at least one more minor release line; a pinned GitHub Discussion;
  and a `loadModule` `console.info` nudge when a UMD plugin loads after the flip.
  **Current: NOT STARTED.**

### Concrete criteria to revisit (distilled)

Re-open this gate only when all three hold:

1. **rslib >= 1.0** (box 1) — the hard blocker today.
2. **A named-export enumeration mechanism is decided** (box 2) — the WS10.1
   runtime vs WS10.2 static comparison must conclude with a chosen, CI-reproducible
   mechanism for all 11 shared modules.
3. **Descriptor shape stable** — ALREADY TRUE. WS7 shipped the C3-strict
   `globalName` discriminator, so a future ESM plugin needs zero descriptor schema
   change (it simply omits `globalName`). This criterion is met now and is not a
   blocker; it is recorded here so a future reader does not re-litigate the
   descriptor shape.

---

## Non-goals of v2 prep (this workstream)

Paths below are stated against the post-cutover single-pipeline layout
(`.webpack/` → `.rspack/`; `rspack.pwa.js` removed; `rsbuild.config.ts` at repo
root is the sole HTML/app build). Where the original spec cited a webpack path,
the current equivalent is given.

- `platform/app/public/html-templates/index.html` is NOT modified; no import map
  ships by default. Any prototype template stays opt-in via the pre-existing
  `HTML_TEMPLATE` env (`rsbuild.config.ts:36`, formerly `webpack.pwa.js:16`).
- NO host build output changes: the app `output` config (`rsbuild.config.ts` /
  `.rspack/rspack.base.js`, formerly `webpack.base.js:90-93`) and the app's
  non-ESM chunk format are untouched; no `experiments.outputModule` anywhere.
- NO dist ESM build is added to `@ohif/core` or any platform package:
  `platform/core` keeps `main: dist/ohif-core.umd.js`
  (`platform/core/package.json`) and its UMD-only prod build
  (`platform/core/.rspack/rspack.prod.js`, formerly
  `platform/core/.webpack/webpack.prod.js`).
- NO changes to `writePluginImportsFile.js` loader codegen from this workstream —
  WS7 owns that file; WS10 only constrains it (the discriminator above).
- create-ohif templates keep UMD as the default until every gate box above is
  checked.
- `.rspack/sharedModules.json` (status: prototype, when it exists) is consumed by
  NO production build path; shims under `platform/app/public/shared/` are
  generated, gitignored prototype output — none of which is built this run.

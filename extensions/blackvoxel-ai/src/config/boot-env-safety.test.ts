/**
 * Regression test for the 2026-06-26 viewer black-screen incident.
 *
 * `clinicalMode.ts` and `condutaSus.ts` read a build-time `process.env.*` flag
 * at MODULE LOAD (a top-level `export const`). They are imported during OHIF
 * extension registration (`pluginImports` → `appInit`), so if a build is ever
 * shipped WITHOUT the matching webpack DefinePlugin entry, the bare `process`
 * reference reaches the browser and throws `ReferenceError: process is not
 * defined` at boot — which rejects `appInit`'s `Promise.all` and black-screens
 * the WHOLE viewer (login → black page, observed live on viewer.blackvoxel.ai).
 *
 * The fix wraps each read in try/catch so a missing define degrades the dark
 * flag to its safe default (OFF) instead of taking the app down. These tests
 * pin that contract by evaluating the modules with `process` unavailable — the
 * exact runtime condition the browser presented.
 *
 * NOTE: jest/jsdom always defines `process`, so we set it to `undefined` to
 * simulate the browser. In the real browser the identifier is unbound
 * (ReferenceError); here `process.env` becomes a TypeError. Both are caught by
 * the same `catch`, so the guard's behaviour is identical.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
describe('blackvoxel-ai boot env-flag fail-safe (2026-06-26 black-screen regression)', () => {
  const g: any = global;
  const realProcess = g.process;

  afterEach(() => {
    g.process = realProcess;
    jest.resetModules();
  });

  describe.each([
    ['./clinicalMode', 'CLINICAL_MODE_ENABLED'],
    ['./condutaSus', 'CONDUTA_SUS_ENABLED'],
  ])('%s', (modulePath, exportName) => {
    it('does not throw and defaults OFF when `process` is unavailable (the incident)', () => {
      g.process = undefined;

      let mod: any = {};
      expect(() => {
        jest.isolateModules(() => {
          mod = require(modulePath);
        });
      }).not.toThrow();
      expect(mod[exportName]).toBe(false);
    });

    it("reads true when the env flag is 'true'", () => {
      g.process = { env: { [exportName]: 'true' } };

      let mod: any = {};
      jest.isolateModules(() => {
        mod = require(modulePath);
      });
      expect(mod[exportName]).toBe(true);
    });

    it('defaults OFF when the env flag is unset', () => {
      g.process = { env: {} };

      let mod: any = {};
      jest.isolateModules(() => {
        mod = require(modulePath);
      });
      expect(mod[exportName]).toBe(false);
    });
  });
});

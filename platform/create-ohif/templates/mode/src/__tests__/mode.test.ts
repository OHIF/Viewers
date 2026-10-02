import { describe, expect, it } from 'vitest';
import mode from '../index';
import pkg from '../../package.json';

describe('{{name}} mode contract smoke test', () => {
  it('id equals the package name (runtime-descriptor contract)', () => {
    expect(mode.id).toBe(pkg.name);
  });

  it('modeFactory produces a routable mode', () => {
    expect(typeof mode.modeFactory).toBe('function');
    const m = mode.modeFactory({ modeConfiguration: {} });

    expect(m.routes.length).toBeGreaterThanOrEqual(1);
    expect(typeof m.routes[0].layoutTemplate).toBe('function');

    expect(m.extensions).toBe(mode.extensionDependencies);
    for (const key of Object.keys(m.extensions)) {
      expect(key).toMatch(/^@?[a-z]/);
    }

    expect(Array.isArray(m.sopClassHandlers)).toBe(true);
    expect(m.sopClassHandlers.length).toBeGreaterThan(0);
    for (const handler of m.sopClassHandlers) {
      expect(typeof handler).toBe('string');
    }
  });
});

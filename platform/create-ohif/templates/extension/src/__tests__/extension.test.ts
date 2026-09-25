import { describe, expect, it } from 'vitest';
import extension from '../index';
import pkg from '../../package.json';
import { registerExtensionHarness } from './harness';

describe('{{name}} registration smoke test', () => {
  it('id equals the package name (runtime-descriptor contract)', () => {
    expect(extension.id).toBe(pkg.name);
  });
  it('registers headlessly and every declared module returns entries', async () => {
    const { modules } = await registerExtensionHarness(extension);
    expect(Object.keys(modules).length).toBeGreaterThan(0);
  });
});

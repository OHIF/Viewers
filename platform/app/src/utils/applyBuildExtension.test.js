import fs from 'fs';
import os from 'os';
import path from 'path';

const applyBuildExtension = require('../../.webpack/applyBuildExtension');

describe('applyBuildExtension (OHIF_BUILD_EXTEND)', () => {
  let dir;

  // Fixture modules avoid syntax that Babel would rewrite with runtime helpers,
  // which cannot be resolved from the temporary directory.
  const writeModule = (name, source) => {
    const file = path.join(dir, name);
    fs.writeFileSync(file, source);
    return file;
  };

  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ohif-build-extend-'));
  });

  afterEach(() => {
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it('returns the config unchanged when the variable is unset', () => {
    const config = { a: 1 };
    expect(applyBuildExtension(config, 'rsbuild', {}, {})).toBe(config);
  });

  it('calls the function for the build in use with the config and context', () => {
    const file = writeModule(
      'ext.js',
      `module.exports = {
        rsbuild: (config, context) => Object.assign({}, config, { extended: context.mode }),
        rspack: () => { throw new Error('wrong build'); },
      };`
    );
    const result = applyBuildExtension(
      { a: 1 },
      'rsbuild',
      { mode: 'production', isProd: true },
      { OHIF_BUILD_EXTEND: file }
    );
    expect(result).toEqual({ a: 1, extended: 'production' });
  });

  it('keeps the mutated config when the function returns nothing', () => {
    const file = writeModule(
      'mutate.js',
      `module.exports = { rspack: config => { config.plugins.push('extra'); } };`
    );
    const config = { plugins: [] };
    expect(applyBuildExtension(config, 'rspack', {}, { OHIF_BUILD_EXTEND: file })).toEqual({
      plugins: ['extra'],
    });
  });

  it('accepts a default export and ignores a module without that build', () => {
    const file = writeModule(
      'esm.js',
      `module.exports = { default: { rsbuild: config => Object.assign({}, config, { b: 2 }) } };`
    );
    expect(applyBuildExtension({}, 'rsbuild', {}, { OHIF_BUILD_EXTEND: file })).toEqual({ b: 2 });
    const config = {};
    expect(applyBuildExtension(config, 'rspack', {}, { OHIF_BUILD_EXTEND: file })).toBe(config);
  });

  it('names the module when it cannot be loaded', () => {
    expect(() =>
      applyBuildExtension({}, 'rsbuild', {}, { OHIF_BUILD_EXTEND: path.join(dir, 'missing.js') })
    ).toThrow(/OHIF_BUILD_EXTEND: cannot load .*missing\.js/);
  });
});

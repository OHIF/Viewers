const path = require('path');

/**
 * Optional build extension hook, shared by the rsbuild build (rsbuild.config.ts)
 * and the rspack build (webpack.pwa.js).
 *
 * A downstream app that needs its own build-time defines, extra copied files,
 * plugins or dev-server settings can point `OHIF_BUILD_EXTEND` at a CommonJS
 * module instead of editing the upstream configs:
 *
 *   OHIF_BUILD_EXTEND=./my-app/build-extend.js pnpm run build
 *
 * The module may export `rsbuild(config, context)` and/or `rspack(config, context)`.
 * Each receives the finished config for that build and returns the config to
 * use (returning nothing keeps the possibly mutated `config`). `context` is
 * `{ mode, isProd, env }`. When the variable is unset, or the module has no
 * function for the build in use, the config is returned unchanged.
 *
 * @param {object} config The finished build config.
 * @param {'rsbuild' | 'rspack'} kind Which build is being configured.
 * @param {{ mode?: string, isProd?: boolean }} [context]
 * @param {NodeJS.ProcessEnv} [env] Defaults to `process.env` (tests pass their own).
 * @returns {object} The config to use.
 */
function applyBuildExtension(config, kind, context = {}, env = process.env) {
  const modulePath = env.OHIF_BUILD_EXTEND;
  if (!modulePath) {
    return config;
  }
  const resolved = path.resolve(process.cwd(), modulePath);
  let extension;
  try {
    extension = require(resolved);
  } catch (error) {
    throw new Error(`OHIF_BUILD_EXTEND: cannot load ${resolved}: ${error.message}`);
  }
  const extend = extension?.[kind] ?? extension?.default?.[kind];
  if (typeof extend !== 'function') {
    return config;
  }
  const result = extend(config, { ...context, env });
  return result === undefined ? config : result;
}

module.exports = applyBuildExtension;

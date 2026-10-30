const fs = require('fs');

/**
 * Injects a precache manifest of all emitted assets into the service worker
 * source (replacing `self.__WB_MANIFEST`) and emits it as `swDest`.
 *
 * Registered by the app build (rsbuild.config.ts) via tools.rspack.plugins.
 * All bundler APIs are taken from `compiler.webpack` inside `apply()` rather
 * than imported from `@rspack/core` at module scope, so the plugin works
 * against whichever rspack version the running pipeline bundles.
 */
class InjectServiceWorkerManifestPlugin {
  constructor({ swSrc, swDest, publicPath, exclude, maximumFileSizeToCacheInBytes }) {
    this.swSrc = swSrc;
    this.swDest = swDest;
    this.publicPath = publicPath;
    this.exclude = exclude;
    this.maximumFileSizeToCacheInBytes = maximumFileSizeToCacheInBytes;
  }

  apply(compiler) {
    const pluginName = 'InjectServiceWorkerManifestPlugin';
    const { sources, Compilation } = compiler.webpack;
    const publicPath = this.publicPath.endsWith('/') ? this.publicPath : `${this.publicPath}/`;

    compiler.hooks.thisCompilation.tap(pluginName, compilation => {
      compilation.hooks.processAssets.tap(
        {
          name: pluginName,
          stage: Compilation.PROCESS_ASSETS_STAGE_REPORT,
        },
        () => {
          const manifest = compilation
            .getAssets()
            .filter(asset => {
              if (asset.name === this.swDest || asset.name.endsWith('.map')) {
                return false;
              }
              if (this.exclude.some(pattern => pattern.test(asset.name))) {
                return false;
              }
              return asset.source.size() <= this.maximumFileSizeToCacheInBytes;
            })
            .map(asset => ({
              url: `${publicPath}${asset.name}`,
              revision: asset.info.contenthash ? null : compilation.hash,
            }));

          const source = fs
            .readFileSync(this.swSrc, 'utf8')
            .replace('self.__WB_MANIFEST', JSON.stringify(manifest));

          compilation.emitAsset(this.swDest, new sources.RawSource(source));
        }
      );
    });
  }
}

module.exports = InjectServiceWorkerManifestPlugin;

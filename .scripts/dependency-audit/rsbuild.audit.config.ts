// Build config for the daily dependency check (.github/workflows/dependency-check-daily.yml)
// only. OHIF's normal builds never load this file. It loads OHIF's real
// rsbuild.config.ts unchanged and adds two things for dist-packages.mjs:
//
// - `extractSourceMap` for node_modules, so code a library inlined from another
//   package (e.g. deepmerge-ts inside shepherd.js) shows up in our source maps.
//   It makes the build log many "Failed to parse source map from
//   .../node_modules/<pkg>/src/..." warnings: those libraries' maps point to
//   source files they don't publish. Harmless; the package is still found from
//   the path.
// - The build's copy list and dist folder, written to $AUDIT_RECORD, so
//   dist-packages.mjs knows which packages are copied into dist whole.
import fs from 'node:fs';
import path from 'node:path';
import base from '../../rsbuild.config.ts';

export default async (ctx: any) => {
  const config: any = typeof base === 'function' ? await (base as any)(ctx) : base;
  // Caution: relies on `output.distPath.root` and on `output.copy` being a list
  // of `{ from, to }` (or strings), as in OHIF's rsbuild.config.ts. A package
  // copied into dist some other way (e.g. a copy plugin outside output.copy) isn't
  // seen as in the build: its findings show as "Review promptly"/"Review soon"
  // rather than "Review immediately".
  const distRoot = path.resolve(config.output.distPath.root);
  const copyRules = (config.output.copy ?? []).map((rule: any) => {
    const { from, to } = typeof rule === 'string' ? { from: rule, to: undefined } : rule;
    return { from: path.resolve(from), to: path.resolve(distRoot, to ?? '.') };
  });
  fs.writeFileSync(
    process.env.AUDIT_RECORD!,
    JSON.stringify(
      { context: path.resolve(config.root ?? process.cwd()), distRoot, copyRules },
      null,
      1
    )
  );

  const previous = config.tools?.rspack;
  config.tools = {
    ...config.tools,
    rspack: [
      ...(Array.isArray(previous) ? previous : previous ? [previous] : []),
      (rspackConfig: any) => {
        rspackConfig.module.rules.unshift({
          test: /\.m?js$/,
          include: /node_modules/,
          extractSourceMap: true,
        });
        return rspackConfig;
      },
    ],
  };
  return config;
};

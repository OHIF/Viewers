#!/usr/bin/env node
/**
 * scripts/verify-umd-global.mjs
 *
 * Proves the runtime-loading primitive works against a real built artifact:
 * rspack emits the UMD wrapper as `!function(e,t){...}(globalThis, ...)`, so
 * under native ESM `import()` — where `exports`, `module`, and `define` are all
 * undefined — it falls through to the global branch and assigns
 * `window['ohif-extension-dicom-pdf'] = factory(window['@ohif/core'], window['react'], ...)`,
 * i.e. the bundle publishes itself under window[libraryName] and reads every
 * external from window[<full package name>] — exactly the runtimeShared
 * host-global contract (see .rspack/pluginExternals.js).
 *
 * Flow:
 *   1. Build @ohif/extension-dicom-pdf (skip with --no-build).
 *   2. Serve its dist/ plus an inline index.html that stubs the host globals,
 *      then `await import()`s the UMD from a <script type="module">.
 *   3. Open the page in headless chromium (playwright, resolved from the repo
 *      root node_modules) and read back window.__result.
 *   4. PASS iff the global exists and its .default.id is the package name.
 *
 * Flags:
 *   --no-build  reuse the existing dist instead of rebuilding.
 *   --no-stubs  negative test: omit the host-global stubs. import() still
 *               resolves, but the factory receives undefined externals and the
 *               module evaluation throws; the script must exit 1, not hang.
 */

import { execSync } from 'node:child_process';
import { createServer } from 'node:http';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const distDir = path.join(repoRoot, 'extensions', 'dicom-pdf', 'dist');
const umdFile = 'ohif-extension-dicom-pdf.umd.js';
const globalKey = 'ohif-extension-dicom-pdf';
const expectedId = '@ohif/extension-dicom-pdf';

const args = process.argv.slice(2);
const noBuild = args.includes('--no-build');
const noStubs = args.includes('--no-stubs');

function fail(message) {
  console.error(`FAIL: ${message}`);
  process.exit(1);
}

// 1. Build the smallest extension unless told not to.
if (!noBuild) {
  console.log('Building @ohif/extension-dicom-pdf ...');
  execSync('pnpm --filter @ohif/extension-dicom-pdf run build', {
    cwd: repoRoot,
    stdio: 'inherit',
  });
}

if (!existsSync(path.join(distDir, umdFile))) {
  fail(
    `${path.join(distDir, umdFile)} not found. Run without --no-build, or run ` +
      `pnpm --filter @ohif/extension-dicom-pdf run build first.`
  );
}

// 2. Inline page. The stub block mirrors what platform/app's runtimeShared
// module provides in the real host: one window[<full package name>] global per
// externals-contract entry this bundle dereferences (.rspack/pluginExternals.js:
// the 'react'/'react-dom'/'react/jsx-runtime' string entries plus the /^@ohif/
// regex packages used by dicom-pdf — @ohif/core and @ohif/i18n).
//
// Spec substitution note: the spec's stub loop assigns `{}` for every key, but
// the dicom-pdf bundle calls React.lazy at module-evaluation time, so a bare
// `{}` react stub throws inside the factory. The react stub therefore carries
// the minimal callable members; the other keys stay `{}` as specced.
const stubBlock = noStubs
  ? '<script>/* --no-stubs: host globals deliberately absent */</script>'
  : `<script>
  for (const k of ['react','react-dom','react/jsx-runtime','@ohif/core','@ohif/i18n']) window[k] = {};
  window['react'] = {
    lazy: component => component,
    createElement: () => null,
    Suspense: function Suspense() {},
  };
</script>`;

const indexHtml = `<!doctype html>
<html>
<head><meta charset="utf-8"><title>verify-umd-global</title></head>
<body>
${stubBlock}
<script type="module">
  try {
    await import('/${umdFile}');
    const g = window['${globalKey}'];
    window.__result = { ok: !!g, id: g && g.default && g.default.id };
  } catch (e) {
    window.__result = { ok: false, err: String(e) };
  }
</script>
</body>
</html>`;

const mime = {
  '.js': 'text/javascript',
  '.map': 'application/json',
  '.css': 'text/css',
  '.html': 'text/html',
};

const server = createServer((req, res) => {
  const urlPath = new URL(req.url, 'http://127.0.0.1').pathname;
  if (urlPath === '/' || urlPath === '/index.html') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(indexHtml);
    return;
  }
  // Serve dist/* only; reject anything that escapes the directory.
  const filePath = path.join(distDir, path.normalize(urlPath).replace(/^([.][.][/\\])+/, ''));
  if (!filePath.startsWith(distDir + path.sep) || !existsSync(filePath)) {
    res.writeHead(404);
    res.end('not found');
    return;
  }
  res.writeHead(200, { 'Content-Type': mime[path.extname(filePath)] || 'application/octet-stream' });
  res.end(readFileSync(filePath));
});

await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const { port } = server.address();
const pageUrl = `http://127.0.0.1:${port}/`;

// 3. Headless chromium via playwright (resolvable from the repo root
// node_modules; not a root devDependency, so fail with a hint if absent).
let chromium;
try {
  ({ chromium } = await import('playwright'));
} catch {
  try {
    ({ chromium } = await import('@playwright/test'));
  } catch {
    server.close();
    fail(
      'Neither playwright nor @playwright/test is resolvable from the repo root. ' +
        'Install playwright (pnpm add -D -w playwright && pnpm exec playwright install chromium) and retry.'
    );
  }
}

let browser;
let result;
try {
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto(pageUrl);
  await page.waitForFunction(() => window.__result !== undefined, null, { timeout: 15000 });
  result = await page.evaluate(() => window.__result);
} catch (e) {
  result = { ok: false, err: `harness error: ${e && e.message ? e.message : String(e)}` };
} finally {
  if (browser) {
    await browser.close().catch(() => {});
  }
  server.close();
}

// 4. Assert and report.
if (result && result.ok === true && result.id === expectedId) {
  console.log(`PASS: window['${globalKey}'].default.id === '${expectedId}'`);
  process.exit(0);
}

fail(
  `window['${globalKey}'] check failed: ` +
    `ok=${result && result.ok}, id=${result && JSON.stringify(result.id)}` +
    (result && result.err ? `, err=${result.err}` : '')
);

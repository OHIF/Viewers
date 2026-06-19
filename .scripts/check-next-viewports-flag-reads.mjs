import fs from 'node:fs';
import path from 'node:path';

/**
 * Guards the `useNextViewports` flag-read surface (migration plan §4.2).
 *
 * The native ("next") GenericViewport opt-in flag must be read in only a small,
 * fixed set of places so the legacy (flag-off) path cannot drift. This check fails
 * if any OTHER file under extensions/cornerstone/src reads the flag, via either
 * `isNextViewportsEnabled()` or `appConfig.useNextViewports`.
 *
 * Sanctioned readers (keep this list and the plan §4.2 in sync):
 *   - utils/getCornerstoneViewportType.ts  — sanctioned read #1 (viewport type selection)
 *   - services/ViewportService/CornerstoneViewportService.ts — sanctioned read #2 (backend selection)
 *   - utils/nextViewports.ts                — the accessor module itself (defines get/set)
 *   - init.tsx                              — the single setup site that reads appConfig.useNextViewports
 *                                             to seed the accessor
 *   - getToolbarModule.tsx                  — TEMP dev toggle evaluator (remove at M7; see
 *                                             TODO_BEFORE_MERGE.md, and drop this entry then)
 *   - *.test.ts(x)                          — unit tests exercising the mapping
 *
 * Everywhere else, branch on cornerstone CONTENT/CAPABILITY predicates
 * (csUtils.isGenericViewport / viewportIsInVolumeMode / viewportIsInStackMode), or
 * route the viewport through the Legacy/Next backend twins — never the flag.
 */

const SRC_DIR = path.resolve(process.cwd(), 'extensions', 'cornerstone', 'src');

// Allowlisted files, relative to SRC_DIR (POSIX separators).
const ALLOWLIST = new Set([
  'utils/getCornerstoneViewportType.ts',
  'services/ViewportService/CornerstoneViewportService.ts',
  'utils/nextViewports.ts',
  'init.tsx',
  // TEMP — remove together with the dev toggle button (TODO_BEFORE_MERGE.md):
  'getToolbarModule.tsx',
]);

// Matches an actual flag READ: the accessor call or the appConfig field access.
const READ_PATTERNS = [/\bisNextViewportsEnabled\s*\(/, /\bappConfig[?.]*\.useNextViewports\b/];

function isCommentLine(line) {
  const t = line.trim();
  return t.startsWith('//') || t.startsWith('*') || t.startsWith('/*');
}

function walk(dir, out) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full, out);
    } else if (/\.tsx?$/.test(entry.name)) {
      out.push(full);
    }
  }
  return out;
}

if (!fs.existsSync(SRC_DIR)) {
  console.error(`[next:check-flag-reads] Source dir not found: ${SRC_DIR}`);
  process.exit(1);
}

const offenders = [];

for (const file of walk(SRC_DIR, [])) {
  const rel = path.relative(SRC_DIR, file).split(path.sep).join('/');
  if (ALLOWLIST.has(rel) || /\.test\.tsx?$/.test(rel)) {
    continue;
  }

  const lines = fs.readFileSync(file, 'utf8').split('\n');
  lines.forEach((line, i) => {
    if (isCommentLine(line)) {
      return;
    }
    if (READ_PATTERNS.some(re => re.test(line))) {
      offenders.push(`${rel}:${i + 1}: ${line.trim()}`);
    }
  });
}

if (offenders.length > 0) {
  console.error(
    '[next:check-flag-reads] The useNextViewports flag is read outside the sanctioned set (plan §4.2).\n' +
      'Branch on cornerstone content/capability predicates or the Legacy/Next backend twins instead,\n' +
      'or add the file to the allowlist in .scripts/check-next-viewports-flag-reads.mjs if the read is\n' +
      'genuinely a sanctioned seam. Offending reads:\n' +
      offenders.map(o => `  - ${o}`).join('\n')
  );
  process.exit(1);
}

console.log('[next:check-flag-reads] OK: useNextViewports is read only in the sanctioned set.');

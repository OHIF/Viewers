// Where the React Compiler applies.
//
// Every consumer of that decision reads this file, so changing the lists here
// changes all of them at once:
//
//   babel.config.js                    the compiler pass (pnpm dev, package builds, jest)
//   rsbuild.config.ts                  the compiler pass (pnpm dev:fast, pnpm build)
//   eslint.config.mjs                  which files the compiler lint rules run on
//   scripts/reactCompilerBudget.mjs    which files the coverage gate scans
//
// A file is compiled when it sits under `<root>/src/` for one of `roots` and is
// not under any of `excluded`. Per-file opt-outs are still 'use no memo'
// directives in the source, tracked by .react-compiler-budget.json; this file
// is for whole directories.
//
// CommonJS because babel.config.js is CommonJS. The ESM and TS consumers import
// it without trouble.
const fs = require('node:fs');
const path = require('node:path');

const repoRoot = __dirname;

/** Workspace packages whose `src/` the compiler applies to. `*` matches one directory. */
const roots = [
  'platform/app',
  'platform/core',
  'platform/i18n',
  'platform/ui-next',
  'extensions/*',
  'modes/*',
];

/** Directories the compiler must never touch, even if they sit under a root. */
const excluded = [
  // Frozen legacy UI package. Outside the app graph since 3.14, so a miscompile
  // there would ship unnoticed; and its rules-of-React violations were never
  // counted in the lint budget.
  'platform/ui',
];

// REACT_COMPILER=off disables the compiler pass everywhere. It is a DIAGNOSTIC,
// not a fallback. 3.14 removed the hand-written useMemo/useCallback wrappers the
// compiler makes redundant, so with the pass off the app runs with LESS
// memoization than any release has ever shipped with. Components that depend on
// stable references - viewport overlays, effects keyed on callbacks - re-run or
// misbehave.
//
// That also changes what the switch tells you. "Works with it off, breaks with
// it on" used to point at the compiler. Now it usually means the component
// breaks the Rules of React by relying on re-running every render, and the
// compiler is right to stop that. Never build or deploy with the switch set.
const enabled = process.env.REACT_COMPILER !== 'off';
if (!enabled) {
  console.warn(
    '[react-compiler] REACT_COMPILER=off: the app is running with no memoization at all. ' +
      'This is a diagnostic setting, not a fallback. Do not build or deploy this way.'
  );
}

const SOURCE = /\.[jt]sx?$/;

/** Repo-relative, forward-slash form of an absolute or relative path. */
function toRelative(file) {
  const rel = path.isAbsolute(file) ? path.relative(repoRoot, file) : file;
  return rel.split(path.sep).join('/');
}

/** Does `rel` sit under `<root>/src/`? `*` in the root matches exactly one segment. */
function underRoot(rel, root) {
  const want = root.split('/');
  const have = rel.split('/');
  if (have.length < want.length + 2) {
    return false; // needs <root segments> + 'src' + at least a file name
  }
  return (
    want.every((segment, i) => segment === '*' || segment === have[i]) &&
    have[want.length] === 'src'
  );
}

function isExcluded(rel) {
  return excluded.some(dir => rel === dir || rel.startsWith(dir + '/'));
}

/**
 * True when the compiler applies to this file. Accepts an absolute path (what
 * babel and the bundlers pass) or a repo-relative one (what `git ls-files`
 * prints). Anything outside the repo, under node_modules, not a JS/TS source
 * file, or under an excluded directory is false.
 */
function isCompiled(file) {
  if (!file) {
    return false;
  }
  const rel = toRelative(file);
  if (rel.startsWith('..') || /(^|\/)node_modules\//.test(rel)) {
    return false;
  }
  if (!SOURCE.test(rel) || isExcluded(rel)) {
    return false;
  }
  return roots.some(root => underRoot(rel, root));
}

// Derived forms, for the consumers that cannot take a predicate.

/** ESLint `files` globs. */
const globs = roots.map(root => `${root}/src/**/*.{js,jsx,ts,tsx}`);

/** ESLint `ignores` entries for the excluded directories. */
const ignoreGlobs = excluded.map(dir => `${dir}/**`);

/** `git ls-files` pathspecs. */
const gitPathspecs = roots.map(root => `${root}/src/**`);

// The bundlers treat a string condition as a plain prefix match on the absolute
// resource path. Every directory handed to them therefore ends in a separator:
// without it, `...\platform\ui` also matches every file under
// `...\platform\ui-next`, and all of ui-next silently stops being compiled.
// (The regexes this file replaced guarded the same edge with `(?!ui[\\/])`.)
const asDirPrefix = dir => path.join(repoRoot, dir) + path.sep;

/**
 * Absolute `<root>/src/` directory prefixes for a bundler `include`, with `*`
 * expanded against the directories present on disk. Read once at config time,
 * so a package added while a dev server is running needs a restart - which is
 * already true of everything else in the bundler config.
 */
function includeDirs() {
  return roots.flatMap(root => {
    const parts = root.split('/');
    const star = parts.indexOf('*');
    if (star === -1) {
      return [asDirPrefix(path.join(root, 'src'))];
    }
    const parent = path.join(repoRoot, ...parts.slice(0, star));
    if (!fs.existsSync(parent)) {
      return [];
    }
    return fs
      .readdirSync(parent)
      .map(name => path.join(parent, name, ...parts.slice(star + 1), 'src'))
      .filter(dir => fs.existsSync(dir))
      .map(dir => dir + path.sep);
  });
}

/** Absolute directory prefixes for a bundler `exclude`, separator-terminated. */
function excludeDirs() {
  return excluded.map(asDirPrefix);
}

module.exports = {
  enabled,
  roots,
  excluded,
  isCompiled,
  globs,
  ignoreGlobs,
  gitPathspecs,
  includeDirs,
  excludeDirs,
};

// OHIF_ENV build profiles.
//
// The problem this solves: every build variant used to be a `cross-env A=1 B=2
// rsbuild build` line in platform/app/package.json, and the set of plugins
// compiled in was hard-wired to platform/app/pluginConfig.json. A downstream
// deployment therefore had to edit files it does not own just to build.
//
//   OHIF_ENV=./ohif.config.json pnpm run build
//
// The profile supplies DEFAULTS for the build's environment variables. An
// environment variable that is already set wins, so a profile can be committed
// and still overridden for one CI job:
//
//   OHIF_ENV=./profiles/hospital.json PUBLIC_URL=/staging/ pnpm run build
//
// Shape and per-key documentation: ohif.schema.json (repo root). It is the same
// file the `pnpm create ohif` workspace template commits, so a workspace
// manifest and a build profile are one artifact — keys the build does not use
// (ohifVersion, plugins) are accepted and ignored.
//
// Dependency-free and CJS on purpose: this is imported by rsbuild.config.ts,
// by platform/app/.rspack/writePluginImportsFile.js (which tailwind.config.js
// also loads), and by scripts/ohif-plugin.mjs. Whichever of those runs first
// applies the profile; the work is memoized so the rest are no-ops.

const fs = require('fs');
const path = require('path');
const schemaConstraints = require('./schemaConstraints');

const REPO_ROOT = path.resolve(__dirname, '..');
const SCHEMA_PATH = path.join(REPO_ROOT, 'ohif.schema.json');
const DEFAULT_PLUGIN_CONFIG = path.join(REPO_ROOT, 'platform', 'app', 'pluginConfig.json');

// Profile key -> environment variable.
//
// `resolvePath: true`   always resolved against the profile's own directory.
// `resolvePath: 'dot'`  resolved only when the value starts with './' or '../',
//                       because the variable's historical meaning is
//                       "relative to a fixed directory inside the app"
//                       (APP_CONFIG is relative to platform/app/public). A
//                       dot-prefixed value is how an out-of-tree deployment
//                       says "the file I own, next to this profile", and the
//                       consumers accept an absolute path for exactly that.
// (no key)              exported verbatim.
const ENV_BY_KEY = {
  pluginConfig: { env: 'PLUGIN_CONFIG', resolvePath: true },
  appConfig: { env: 'APP_CONFIG', resolvePath: 'dot' },
  publicUrl: { env: 'PUBLIC_URL' },
  htmlTemplate: { env: 'HTML_TEMPLATE' },
  entryTarget: { env: 'ENTRY_TARGET', resolvePath: true },
};

const isDotRelative = value => value.startsWith('./') || value.startsWith('../');
const PROXY_ENV_BY_KEY = {
  target: 'PROXY_TARGET',
  domain: 'PROXY_DOMAIN',
  pathRewriteFrom: 'PROXY_PATH_REWRITE_FROM',
  pathRewriteTo: 'PROXY_PATH_REWRITE_TO',
};
// Accepted for the create-ohif workspace harness, deliberately not mapped to
// any build variable.
const HARNESS_ONLY_KEYS = ['ohifVersion', 'plugins'];

let schemaCache;
function getSchema() {
  if (!schemaCache) {
    schemaCache = JSON.parse(fs.readFileSync(SCHEMA_PATH, 'utf8'));
  }
  return schemaCache;
}

// Structure hand-rolled (see .rspack/schemaConstraints.js for why), value
// constraints read from ohif.schema.json so the two cannot drift.
function validateProfile(profile) {
  const schema = getSchema();
  const properties = schema.properties;
  const constraints = schemaConstraints(properties);
  const errors = [];

  if (typeof profile !== 'object' || profile === null || Array.isArray(profile)) {
    return ['root: must be a JSON object'];
  }

  const check = (label, key, value, spec, constraint) => {
    if (spec.type === 'array') {
      if (!Array.isArray(value)) {
        errors.push(`${label}: must be an array, got ${typeof value}`);
      } else if (value.some(item => typeof item !== 'string')) {
        errors.push(`${label}: must be an array of strings`);
      }
      return;
    }
    if (spec.type === 'object') {
      if (typeof value !== 'object' || value === null || Array.isArray(value)) {
        errors.push(`${label}: must be an object`);
        return;
      }
      const nestedConstraints = schemaConstraints(spec.properties);
      for (const [nestedKey, nestedValue] of Object.entries(value)) {
        if (!spec.properties[nestedKey]) {
          errors.push(
            `${label}.${nestedKey}: unknown key (allowed: ${Object.keys(spec.properties).join(', ')})`
          );
          continue;
        }
        check(
          `${label}.${nestedKey}`,
          nestedKey,
          nestedValue,
          spec.properties[nestedKey],
          nestedConstraints[nestedKey]
        );
      }
      return;
    }
    if (typeof value !== spec.type) {
      errors.push(`${label}: must be a ${spec.type}, got ${typeof value}`);
      return;
    }
    if (!constraint || typeof value !== 'string') {
      return;
    }
    if (constraint.minLength !== undefined && value.length < constraint.minLength) {
      errors.push(`${label}: must not be empty (ohif.schema.json)`);
    } else if (constraint.pattern && !constraint.pattern.test(value)) {
      errors.push(
        `${label}: value ${JSON.stringify(value)} does not match the schema pattern ` +
          `/${constraint.pattern.source}/ (ohif.schema.json)`
      );
    }
  };

  for (const [key, value] of Object.entries(profile)) {
    if (!properties[key]) {
      errors.push(`"${key}": unknown key (allowed: ${Object.keys(properties).join(', ')})`);
      continue;
    }
    check(`"${key}"`, key, value, properties[key], constraints[key]);
  }
  return errors;
}

let applied;

/**
 * Read OHIF_ENV (if set) and export its keys as environment variables that are
 * not already set. Idempotent; returns { path, profile } or null when no
 * profile is configured.
 */
function applyBuildProfile() {
  if (applied !== undefined) {
    return applied;
  }
  const configured = process.env.OHIF_ENV;
  if (!configured) {
    applied = null;
    return applied;
  }
  const profilePath = path.resolve(process.cwd(), configured);
  if (!fs.existsSync(profilePath)) {
    throw new Error(
      `OHIF_ENV points at "${configured}", which does not exist (resolved to ${profilePath}). ` +
        'Paths are resolved from the current working directory; see ohif.schema.json for the ' +
        'profile shape.'
    );
  }
  let profile;
  try {
    profile = JSON.parse(fs.readFileSync(profilePath, 'utf8'));
  } catch (e) {
    throw new Error(`OHIF_ENV profile ${profilePath} is not valid JSON: ${e.message}`);
  }
  const errors = validateProfile(profile);
  if (errors.length) {
    throw new Error(
      `Invalid OHIF_ENV profile ${profilePath} (${errors.length} error${errors.length === 1 ? '' : 's'}):\n` +
        errors.map(e => `  - ${e}`).join('\n') +
        '\nExpected shape: ohif.schema.json'
    );
  }

  const profileDir = path.dirname(profilePath);
  const exported = [];
  const exportVar = (name, value) => {
    // Already-set variables win: a committed profile must stay overridable per
    // invocation (CI overriding PUBLIC_URL for a staging build, say).
    if (process.env[name] !== undefined && process.env[name] !== '') {
      return;
    }
    process.env[name] = value;
    exported.push(name);
  };

  for (const [key, { env, resolvePath }] of Object.entries(ENV_BY_KEY)) {
    const value = profile[key];
    if (typeof value !== 'string' || !value) {
      continue;
    }
    const resolve = resolvePath === 'dot' ? isDotRelative(value) : Boolean(resolvePath);
    exportVar(env, resolve ? path.resolve(profileDir, value) : value);
  }
  for (const [key, env] of Object.entries(PROXY_ENV_BY_KEY)) {
    const value = profile.proxy && profile.proxy[key];
    if (typeof value === 'string' && value) {
      exportVar(env, value);
    }
  }

  console.log(
    `OHIF_ENV: ${path.relative(process.cwd(), profilePath) || profilePath}` +
      (exported.length ? ` → ${exported.join(', ')}` : ' → nothing to export')
  );
  applied = { path: profilePath, profile };
  return applied;
}

/**
 * Absolute path of the pluginConfig.json this build/tool should read. Applies
 * the profile first, so importing this module is enough to honor OHIF_ENV.
 */
function resolvePluginConfigPath() {
  applyBuildProfile();
  const configured = process.env.PLUGIN_CONFIG;
  if (!configured) {
    return DEFAULT_PLUGIN_CONFIG;
  }
  const resolved = path.resolve(process.cwd(), configured);
  if (!fs.existsSync(resolved)) {
    throw new Error(
      `PLUGIN_CONFIG points at "${configured}", which does not exist (resolved to ${resolved}).`
    );
  }
  return resolved;
}

module.exports = {
  applyBuildProfile,
  resolvePluginConfigPath,
  validateProfile,
  REPO_ROOT,
  DEFAULT_PLUGIN_CONFIG,
  HARNESS_ONLY_KEYS,
  ENV_BY_KEY,
  PROXY_ENV_BY_KEY,
};

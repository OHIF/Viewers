'use strict';

const path = require('path');

/**
 * On Windows, webpack treats module ids as case-sensitive; mixed `z:` / `Z:` breaks
 * resolution (duplicate graphs, CaseSensitiveModulesWarning). Uppercase the drive letter.
 * No-op on non-Windows or non–drive-letter paths.
 *
 * @param {string} p
 * @returns {string}
 */
function normalizeWindowsDriveLetter(p) {
  if (process.platform !== 'win32' || p == null || typeof p !== 'string') {
    return p;
  }
  const resolved = path.resolve(p.trim());
  if (!resolved) {
    return p;
  }
  if (/^[a-z]:[\\/]/.test(resolved)) {
    return resolved[0].toUpperCase() + resolved.slice(1);
  }
  return resolved;
}

module.exports = { normalizeWindowsDriveLetter };

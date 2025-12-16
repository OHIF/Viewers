/**
 * Checks if a path is an absolute URL (http/https) or absolute path (starts with /)
 * @param {string} path - The path to check
 * @returns {boolean} True if the path is absolute
 */
export function isAbsolutePathOrUrl(path) {
  if (!path || typeof path !== 'string') {
    return false;
  }
  return path.startsWith('http://') || path.startsWith('https://') || path.startsWith('/');
}

/**
 * Joins a base URL with a relative path
 * @param {string} baseUrl - The base URL
 * @param {string} path - The path to join
 * @returns {string} The joined URL
 */
export function joinUrl(baseUrl, path) {
  if (!baseUrl) return path || '';
  if (!path) return baseUrl;

  // Remove trailing slash from baseUrl and leading slash from path
  const base = baseUrl.replace(/\/+$/, '');
  const relativePath = path.replace(/^\/+/, '');

  return `${base}/${relativePath}`;
}

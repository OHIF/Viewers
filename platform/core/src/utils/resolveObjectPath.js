export default function resolveObjectPath(root, path, defaultValue) {
  if (root !== null && typeof root === 'object' && typeof path === 'string') {
    let value,
      separator = path.indexOf('.');
    if (separator >= 0) {
      return resolveObjectPath(
        root[path.slice(0, separator)],
        path.slice(separator + 1, path.length),
        defaultValue
      );
    }
    value = root[path];
    return value === undefined && defaultValue !== undefined ? defaultValue : value;
  }
}

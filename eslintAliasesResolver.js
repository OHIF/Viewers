module.exports.interfaceVersion = 2;

module.exports.resolve = (source, file, aliases) => {
  if (aliases[source]) {
    return { found: true, path: aliases[source] };
  }
  return { found: false };
};

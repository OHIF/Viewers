const absoluteUrl = path => {
  let absolutePath = '/';

  if (!path) return absolutePath;

  // TODO: Find another way to get root url
  const absoluteUrl = window.location.origin;
  const absoluteUrlParts = absoluteUrl.split('/');

  if (absoluteUrlParts.length > 4) {
    const rootUrlPrefixIndex = absoluteUrl.indexOf(absoluteUrlParts[3]);
    absolutePath += absoluteUrl.substring(rootUrlPrefixIndex) + path;
  } else {
    absolutePath += path;
  }

  return absolutePath.replace(/\/\/+/g, '/');
};

export default absoluteUrl;

function isValidUrl(url) {
  try {
    const urlObj = new URL(url);
  } catch (_) {
    return false;
  }

  return true;
}

export default isValidUrl;
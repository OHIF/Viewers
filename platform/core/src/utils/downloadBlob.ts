/**
 * Converts a blob to a URL and downloads immediate
 */
export function downloadBlob(content, options?) {
  const url = URL.createObjectURL(content);
  downloadUrl(url, options);
  URL.revokeObjectURL(url);
}

/**
 * Downloads a URL
 */
export function downloadUrl(url, options?) {
  const link = document.createElement('a');
  link.setAttribute('href', url);
  const filename = options?.filename || 'file.dcm';
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
}

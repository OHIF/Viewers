/**
 * Converts a blob to a URL and downloads immediate
 */
export function downloadBlob(content, options?) {
  const url = URL.createObjectURL(content);
  downloadUrl(url, options);
  URL.revokeObjectURL(url);
}

/**
 * Trigger file download from an array buffer
 * @param buffer
 * @param filename
 */
export function downloadDicom(buffer: ArrayBuffer, options) {
  const blob = new Blob([buffer], { type: 'application/dicom' });
  downloadBlob(blob, options);
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
  document.body.removeChild(link);
}

export function downloadCsv(csvString: string, options?) {
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  downloadBlob(blob, options);
}

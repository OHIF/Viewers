/**
 * Trigger file download from an array buffer
 * @param buffer
 * @param filename
 */
export function saveByteArray(buffer: ArrayBuffer, filename: string) {
  const blob = new Blob([buffer], { type: 'application/dicom' });
  const link = document.createElement('a');
  link.href = window.URL.createObjectURL(blob);
  link.download = filename;
  link.click();
}

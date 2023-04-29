/**
 * Trigger file download from an array buffer
 * @param buffer
 * @param filename
 */
export function saveByteArray(buffer: ArrayBuffer, filename: string) {
  var blob = new Blob([buffer], { type: 'application/dicom' });
  var link = document.createElement('a');
  link.href = window.URL.createObjectURL(blob);
  link.download = filename;
  link.click();
}

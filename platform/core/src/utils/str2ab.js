/**
 * Convert String to ArrayBuffer
 *
 * @param {String} str Input String
 * @return {ArrayBuffer} Output converted ArrayBuffer
 */
export default function str2ab(str) {
  const strLen = str.length;
  const bytes = new Uint8Array(strLen);

  for (let i = 0; i < strLen; i++) {
    bytes[i] = str.charCodeAt(i);
  }

  return bytes.buffer;
}

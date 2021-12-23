/**
 * Convert String to ArrayBuffer
 *
 * @param {String} str Input String
 * @return {ArrayBuffer} Output converted ArrayBuffer
 */
export default str => Uint8Array.from(atob(str), c => c.charCodeAt(0));

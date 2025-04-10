import findIndexOfString from './findIndexOfString';

/**
 * Fix multipart data coming back from the retrieve bulkdata request, but
 * incorrectly tagged as application/octet-stream.  Some servers don't handle
 * the response type correctly, and this method is relatively robust about
 * detecting multipart data correctly.  It will only extract one value.
 */
export default function fixMultipart(arrayData) {
  const data = new Uint8Array(arrayData[0]);
  // Don't know the exact minimum length, but it is at least 25 to encode multipart
  if (data.length < 25) {
    return arrayData;
  }
  const dashIndex = findIndexOfString(data, '--');
  if (dashIndex > 6) {
    return arrayData;
  }
  const tokenIndex = findIndexOfString(data, '\r\n\r\n', dashIndex);
  if (tokenIndex > 512) {
    // Allow for 512 characters in the header - there is no apriori limit, but
    // this seems ok for now as we only expect it to have content type in it.
    return arrayData;
  }
  const header = uint8ArrayToString(data, 0, tokenIndex);
  // Now find the boundary  marker
  const responseHeaders = header.split('\r\n');
  const boundary = findBoundary(responseHeaders);

  if (!boundary) {
    return arrayData;
  }
  // Start of actual data is 4 characters after the token
  const offset = tokenIndex + 4;

  const endIndex = findIndexOfString(data, boundary, offset);
  if (endIndex === -1) {
    return arrayData;
  }

  return [data.slice(offset, endIndex - 2).buffer];
}

export function findBoundary(header: string[]): string {
  for (let i = 0; i < header.length; i++) {
    if (header[i].substr(0, 2) === '--') {
      return header[i];
    }
  }
}

export function findContentType(header: string[]): string {
  for (let i = 0; i < header.length; i++) {
    if (header[i].substr(0, 13) === 'Content-Type:') {
      return header[i].substr(13).trim();
    }
  }
}

export function uint8ArrayToString(data, offset, length) {
  offset = offset || 0;
  length = length || data.length - offset;
  let str = '';

  for (let i = offset; i < offset + length; i++) {
    str += String.fromCharCode(data[i]);
  }

  return str;
}

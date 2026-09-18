/**
 * A bindable function that retrieves bulkdata against `this` DICOMweb client
 * and caches the resolved buffer on the given value element.
 *
 * @param value - A bound value that stores the retrieved buffer.
 * @param options - Options such as the requested content type.
 */
export default function retrieveBulkData(value, options = {}) {
  const { mediaType } = options;
  const useOptions = {
    // The bulkdata fetches work with either multipart or singlepart, so set
    // multipart to false to let the server decide which type to respond with.
    multipart: false,
    BulkDataURI: value.BulkDataURI,
    mediaTypes: mediaType ? [{ mediaType }, { mediaType: 'application/octet-stream' }] : undefined,
    ...options,
  };

  return this.retrieveBulkData(useOptions).then(val => {
    // Single-part clients return a bare ArrayBuffer. Multipart clients return
    // an array; DICOM PDF/video payloads may occupy different positions, so
    // select the first non-empty part in that response shape.
    const ret = Array.isArray(val)
      ? val.find(arrayBuffer => arrayBuffer?.byteLength)
      : val?.byteLength
        ? val
        : undefined;
    value.Value = ret;
    return ret;
  });
}

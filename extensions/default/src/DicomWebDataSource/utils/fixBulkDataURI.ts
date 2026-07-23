/**
 * Modifies a bulkDataURI to ensure it is absolute based on the DICOMWeb configuration and
 * instance data. The modification is in-place.
 *
 * If the bulkDataURI is relative to the series or study (according to the DICOM standard),
 * it is made absolute by prepending the relevant paths.
 *
 * In scenarios where the bulkDataURI is a server-relative path (starting with '/'), the function
 * handles two cases:
 *
 * 1. If the wado root is absolute (starts with 'http'), it prepends the wado root to the bulkDataURI.
 * 2. If the wado root is relative, no changes are needed as the bulkDataURI is already correctly relative to the server root.
 *
 * @param value - The object containing BulkDataURI to be fixed.
 * @param instance - The object (DICOM instance data) containing StudyInstanceUID and SeriesInstanceUID.
 * @param dicomWebConfig - The DICOMWeb configuration object, containing wadoRoot and potentially bulkDataURI.relativeResolution.
 * @returns The function modifies `value` in-place, it does not return a value.
 */
function fixBulkDataURI(value, instance, dicomWebConfig) {
  // in case of the relative path, make it absolute. The current DICOM standard says
  // the bulkdataURI is relative to the series. However, there are situations where
  // it can be relative to the study too
  let { BulkDataURI } = value;
  const { bulkDataURI: uriConfig = {} } = dicomWebConfig;

  BulkDataURI = uriConfig.transform?.(BulkDataURI) || BulkDataURI;

  // Handle incorrectly prefixed origins
  const { startsWith, prefixWith = '' } = uriConfig;
  if (startsWith && BulkDataURI.startsWith(startsWith)) {
    BulkDataURI = prefixWith + BulkDataURI.substring(startsWith.length);
    value.BulkDataURI = BulkDataURI;
  }

  if (!BulkDataURI.startsWith('http') && !value.BulkDataURI.startsWith('/')) {
    const { StudyInstanceUID, SeriesInstanceUID } = instance;
    const isInstanceStart = BulkDataURI.startsWith('instances/') || BulkDataURI.startsWith('../');
    if (
      BulkDataURI.startsWith('series/') ||
      BulkDataURI.startsWith('bulkdata/') ||
      (uriConfig.relativeResolution === 'studies' && !isInstanceStart)
    ) {
      value.BulkDataURI = `${dicomWebConfig.wadoRoot}/studies/${StudyInstanceUID}/${BulkDataURI}`;
    } else if (
      isInstanceStart ||
      uriConfig.relativeResolution === 'series' ||
      !uriConfig.relativeResolution
    ) {
      value.BulkDataURI = `${dicomWebConfig.wadoRoot}/studies/${StudyInstanceUID}/series/${SeriesInstanceUID}/${BulkDataURI}`;
    }
    return;
  }

  // in case it is relative path but starts at the server (e.g., /bulk/1e, note the missing http
  // in the beginning and the first character is /) There are two scenarios, whether the wado root
  // is absolute or relative. In case of absolute, we need to prepend the wado root to the bulkdata
  // uri (e.g., bulkData: /bulk/1e, wado root: http://myserver.com/dicomweb, output: http://myserver.com/bulk/1e)
  // and in case of relative wado root, we need to prepend the bulkdata uri to the wado root (e.g,. bulkData: /bulk/1e
  // wado root: /dicomweb, output: /bulk/1e)
  if (BulkDataURI[0] === '/') {
    if (dicomWebConfig.wadoRoot.startsWith('http')) {
      // Absolute wado root
      const url = new URL(dicomWebConfig.wadoRoot);
      value.BulkDataURI = `${url.origin}${BulkDataURI}`;
    } else {
      // Relative wado root, we don't need to do anything, bulkdata uri is already correct
    }
  }
}

export { fixBulkDataURI };

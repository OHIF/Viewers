function fixBulkDataURI(value, instance, dicomWebConfig) {
  // in case of the relative path, make it absolute. The current DICOM standard says
  // the bulkdataURI is relative to the series. However, there are situations where
  // it can be relative to the study too
  if (
    !value.BulkDataURI.startsWith('http') &&
    !value.BulkDataURI.startsWith('/')
  ) {
    if (dicomWebConfig.bulkDataURI?.relativeResolution === 'studies') {
      value.BulkDataURI = `${dicomWebConfig.wadoRoot}/studies/${instance.StudyInstanceUID}/${value.BulkDataURI}`;
    } else if (
      dicomWebConfig.bulkDataURI?.relativeResolution === 'series' ||
      !dicomWebConfig.bulkDataURI?.relativeResolution
    ) {
      value.BulkDataURI = `${dicomWebConfig.wadoRoot}/studies/${instance.StudyInstanceUID}/series/${instance.SeriesInstanceUID}/${value.BulkDataURI}`;
    }

    return;
  }

  // in case it is relative path but starts at the server (e.g., /bulk/1e, note the missing http
  // in the beginning and the first character is /) There are two scenarios, whether the wado root
  // is absolute or relative. In case of absolute, we need to prepend the wado root to the bulkdata
  // uri (e.g., bulkData: /bulk/1e, wado root: http://myserver.com/dicomweb, output: http://myserver.com/bulk/1e)
  // and in case of relative wado root, we need to prepend the bulkdata uri to the wado root (e.g,. bulkData: /bulk/1e
  // wado root: /dicomweb, output: /bulk/1e)
  if (value.BulkDataURI[0] === '/') {
    if (dicomWebConfig.wadoRoot.startsWith('http')) {
      // Absolute wado root
      const url = new URL(dicomWebConfig.wadoRoot);
      value.BulkDataURI = `${url.origin}${value.BulkDataURI}`;
    } else {
      // Relative wado root, we don't need to do anything, bulkdata uri is already correct
    }
  }
}

export { fixBulkDataURI };

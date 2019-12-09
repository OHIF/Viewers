# Module: SOP Class Handler

...

```js
const SOP_CLASS_UIDS = {
  BASIC_TEXT_SR: '1.2.840.10008.5.1.4.1.1.88.11',
  ENHANCED_SR: '1.2.840.10008.5.1.4.1.1.88.22',
};

const sopClassHandlerModule = {
  id: 'OHIFDicomHtmlSopClassHandler',
  sopClassUids: Object.values(SOP_CLASS_UIDS),

  /**
   * @param {object} series -
   * @param {object} study -
   * @param {object} dicomWebClient -
   * @param {object} authorizationHeaders -
   */
  getDisplaySetFromSeries(series, study, dicomWebClient, authorizationHeaders) {
    const instance = series.getFirstInstance();

    return {
      plugin: 'html',
      displaySetInstanceUid: 0,
      wadoRoot: study.getData().wadoRoot,
      wadoUri: instance.getData().wadouri,
      sopInstanceUid: instance.getSOPInstanceUID(),
      seriesInstanceUid: series.getSeriesInstanceUID(),
      studyInstanceUid: study.getStudyInstanceUID(),
      authorizationHeaders,
    };
  },
};
```

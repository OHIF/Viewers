import { api } from 'dicomweb-client';

/**
 * An implementation of the static wado client, that fetches data from
 * a static response rather than actually doing real queries.  This allows
 * fast encoding of test data, but because it is static, anything actually
 * performing searches doesn't work.  This version fixes the query issue
 * by manually implementing a query option.
 */
export default class StaticWadoClient extends api.DICOMwebClient {
  static filterKeys = {
    "StudyInstanceUID": "0020000D",
    "PatientName": "00100010",
    "00100020": "mrn",
    "StudyDescription": "00081030",
    "ModalitiesInStudy": "00080061",
  };

  constructor(qidoConfig) {
    super(qidoConfig);
    this.staticWado = qidoConfig.staticWado;
  }

  async searchForStudies(options) {
    if (!this.staticWado) return super.searchForStudies(options);

    let searchResult = await super.searchForStudies(options);
    const { queryParams } = options;
    if (!queryParams) return searchResult;
    // console.log('Query params', queryParams);
    const filtered = searchResult.filter(study => {
      for (const key of Object.keys(StaticWadoClient.filterKeys)) {
        if (!this.filterItem(key, queryParams, study)) return false;
      }
      return true;
    });
    // console.log("Searching - filtered response has", filtered.length, "items in it:", filtered);
    return filtered;
  }

  filterItem(key, queryParams, study) {
    const altKey = StaticWadoClient.filterKeys[key] || key;
    if (!queryParams) return true;
    const testValue = queryParams[key] || queryParams[altKey];
    if (!testValue) return true;
    const valueElem = study[key] || study[altKey];
    if (!valueElem) {
      return false;
    }
    const value = valueElem.Value;
    return value === testValue || (value.indexOf && value.indexOf(testValue) >= 0);
  }
}

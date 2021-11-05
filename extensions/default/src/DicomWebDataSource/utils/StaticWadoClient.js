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
    "StudyDate": "00080020",
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
    const filtered = searchResult.filter(study => {
      for (const key of Object.keys(StaticWadoClient.filterKeys)) {
        if (!this.filterItem(key, queryParams, study)) return false;
      }
      return true;
    });
    return filtered;
  }

  compareValues(desired, actual) {
    if (Array.isArray(desired)) {
      return desired.find(item => this.compareValues(item, actual));
    }
    if (Array.isArray(actual)) {
      return actual.find(actualItem => this.compareValues(desired, actualItem));
    }
    if (actual?.Alphabetic) {
      actual = actual.Alphabetic;
    }
    if (typeof (actual) == 'string') {
      return actual.indexOf(desired) != -1;
    }
    return desired === actual;
  }

  compareDateRange(range, value) {
    if (!value) return true;
    const dash = range.indexOf('-');
    if (dash == -1) return this.compareValues(range, value);
    const start = range.substring(0, dash);
    const end = range.substring(dash + 1);
    return (!start || value >= start) &&
      (!end || value <= end);
  }

  filterItem(key, queryParams, study) {
    const altKey = StaticWadoClient.filterKeys[key] || key;
    if (!queryParams) return true;
    const testValue = queryParams[key] || queryParams[altKey];
    if (!testValue) return true;
    const valueElem = study[key] || study[altKey];
    if (!valueElem) return false;
    if (valueElem.vr == 'DA') return this.compareDateRange(testValue, valueElem.Value[0]);
    const value = valueElem.Value;
    return this.compareValues(testValue, value) && true;
  }
}

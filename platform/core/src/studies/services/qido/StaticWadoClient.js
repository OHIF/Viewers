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
    StudyInstanceUID: '0020000D',
    PatientName: '00100010',
    PatientID: '00100020',
    StudyDescription: '00081030',
    ModalitiesInStudy: '00080061',
  };

  constructor(qidoConfig) {
    super(qidoConfig);
    this.staticWado = qidoConfig.staticWado;
    this.extendMetadataWithInstances = qidoConfig.extendMetadataWithInstances;
  }

  async retrieveSeriesMetadata(options) {
    if (!this.extendMetadataWithInstances)
      return super.retrieveSeriesMetadata(options);
    const results = await Promise.all([
      super.retrieveSeriesMetadata(options),
      this.searchForInstances(options),
    ]);
    const metadata = results[0];
    const instances = results[1];
    return metadata.map(item => {
      const sopUID = item['00080018'].Value[0];
      const instance = instances.find(
        instance => instance['00080018'].Value[0] == sopUID
      );
      Object.assign(item, instance);
      return item;
    });
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

  filterItem(key, queryParams, study) {
    const altKey = StaticWadoClient.filterKeys[key] || key;
    if (!queryParams) return true;
    const testValue = queryParams[key] || queryParams[altKey];
    if (!testValue) return true;
    const valueElem = study[key] || study[altKey];
    if (!valueElem) return false;
    const value = valueElem.Value;
    return this.eqItem(testValue, value);
  }

  eqItem(testValue, value) {
    if (testValue.filter) {
      return (
        testValue.filter(testItem => this.eqItem(testItem, value)).length > 0
      );
    }
    if (value === testValue) return true;
    if (typeof value == 'string') {
      return value.indexOf(testValue) != -1;
    }
    if (value.Alphabetic) return this.eqItem(testValue, value.Alphabetic);
    if (value.filter)
      return value.filter(item => this.eqItem(testValue, item)).length > 0;
    return false;
  }
}

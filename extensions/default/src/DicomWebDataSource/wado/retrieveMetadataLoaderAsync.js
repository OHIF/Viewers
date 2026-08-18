import dcmjs from 'dcmjs';
import { sortStudySeries } from '@ohif/core/src/utils/sortStudy';
import RetrieveMetadataLoader from './retrieveMetadataLoader';

// Series Date, Series Time, Series Description and Series Number to be included
// in the series metadata query result
const includeField = ['00080021', '00080031', '0008103E', '00200011'].join(',');

export class DeferredPromise {
  metadata = undefined;
  processFunction = undefined;
  internalPromise = undefined;
  thenFunction = undefined;
  rejectFunction = undefined;

  setMetadata(metadata) {
    this.metadata = metadata;
  }
  setProcessFunction(func) {
    this.processFunction = func;
  }
  getPromise() {
    return this.start();
  }
  start() {
    if (this.internalPromise) {
      return this.internalPromise;
    }
    this.internalPromise = this.processFunction();
    // in case then and reject functions called before start
    if (this.thenFunction) {
      this.then(this.thenFunction);
      this.thenFunction = undefined;
    }
    if (this.rejectFunction) {
      this.reject(this.rejectFunction);
      this.rejectFunction = undefined;
    }
    return this.internalPromise;
  }
  then(func) {
    if (this.internalPromise) {
      return this.internalPromise.then(func);
    } else {
      this.thenFunction = func;
    }
  }
  reject(func) {
    if (this.internalPromise) {
      return this.internalPromise.reject(func);
    } else {
      this.rejectFunction = func;
    }
  }
}

/**
 * Creates a series async loader
 *
 * @param {Object} client The DICOMWebClient instance
 * @param {string} studyInstanceUID The Study Instance UID from which series will be loaded
 * @param {Array} seriesInstanceUIDList A list of Series Instance UIDs
 * @param {Object} dicomWebConfig DICOMweb configuration including caseId
 *
 * @returns {Object} Returns an object which supports loading of instances from each of given Series Instance UID
 */
function makeSeriesAsyncLoader(client, studyInstanceUID, seriesInstanceUIDList, dicomWebConfig = {}) {
  return Object.freeze({
    hasNext() {
      return seriesInstanceUIDList.length > 0;
    },
    next() {
      const { seriesInstanceUID, metadata } = seriesInstanceUIDList.shift();
      const promise = new DeferredPromise();
      promise.setMetadata(metadata);
      promise.setProcessFunction(() => {
        const options = {
          studyInstanceUID,
          seriesInstanceUID,
        };
        // Add caseId to options if present in dicomWebConfig
        if (dicomWebConfig && dicomWebConfig.caseId) {
          options.queryParams = { caseId: dicomWebConfig.caseId };
          console.log('makeSeriesAsyncLoader: Adding caseId to retrieveSeriesMetadata:', dicomWebConfig.caseId);
        }
        return client.retrieveSeriesMetadata(options);
      });
      return promise;
    },
  });
}

/**
 * Class for async load of study metadata.
 * It inherits from RetrieveMetadataLoader
 *
 * It loads the one series and then append to seriesLoader the others to be consumed/loaded
 */
export default class RetrieveMetadataLoaderAsync extends RetrieveMetadataLoader {
  /**
   * @returns {Array} Array of preLoaders. To be consumed as queue
   */
  *getPreLoaders() {
    const preLoaders = [];
    const { studyInstanceUID, filters: { seriesInstanceUID } = {}, client, dicomWebConfig } = this;

    // asking to include Series Date, Series Time, Series Description
    // and Series Number in the series metadata returned to better sort series
    // in preLoad function
    let options = {
      studyInstanceUID,
      queryParams: {
        includefield: includeField,
      },
    };

    // Add caseId to queryParams if present in dicomWebConfig
    if (dicomWebConfig && dicomWebConfig.caseId) {
      options.queryParams.caseId = dicomWebConfig.caseId;
      console.log('retrieveMetadataLoaderAsync getPreLoaders: Adding caseId to queryParams:', dicomWebConfig.caseId);
    }

    if (seriesInstanceUID) {
      options.queryParams.SeriesInstanceUID = seriesInstanceUID;
      preLoaders.push(client.searchForSeries.bind(client, options));
    }
    // Fallback preloader
    preLoaders.push(client.searchForSeries.bind(client, options));

    yield* preLoaders;
  }

  async preLoad() {
    const preLoaders = this.getPreLoaders();
    const result = await this.runLoaders(preLoaders);
    const sortCriteria = this.sortCriteria;
    const sortFunction = this.sortFunction;

    const { naturalizeDataset } = dcmjs.data.DicomMetaDictionary;
    const naturalized = result.map(naturalizeDataset);

    console.log('retrieveMetadataLoaderAsync preLoad: naturalized count:', naturalized.length);
    naturalized.forEach(series => {
      console.log('retrieveMetadataLoaderAsync preLoad: series:', series.SeriesInstanceUID, 'Modality:', series.Modality, 'SOPClassUID:', series.SOPClassUID);
    });

    return sortStudySeries(naturalized, sortCriteria, sortFunction);
  }

  async load(preLoadData) {
    const { client, studyInstanceUID, dicomWebConfig } = this;

    const seriesInstanceUIDs = preLoadData.map(seriesMetadata => {
      return { seriesInstanceUID: seriesMetadata.SeriesInstanceUID, metadata: seriesMetadata };
    });

    const seriesAsyncLoader = makeSeriesAsyncLoader(client, studyInstanceUID, seriesInstanceUIDs, dicomWebConfig);

    const promises = [];

    while (seriesAsyncLoader.hasNext()) {
      const promise = seriesAsyncLoader.next();
      promises.push(promise);
    }

    return {
      preLoadData,
      promises,
    };
  }

  async posLoad({ preLoadData, promises }) {
    return {
      preLoadData,
      promises,
    };
  }
}

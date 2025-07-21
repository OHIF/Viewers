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
  thenQueue = [];
  catchQueue = [];

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
    if (!this.internalPromise) {
      if (!this.processFunction) {
        throw new Error('processFunction is not set');
      }

      this.internalPromise = this.processFunction();

      // Apply queued .then() and .catch() callbacks
      for (const func of this.thenQueue) {
        this.internalPromise = this.internalPromise.then(func);
      }
      for (const func of this.catchQueue) {
        this.internalPromise = this.internalPromise.catch(func);
      }

      this.thenQueue = [];
      this.catchQueue = [];
    }
    return this.internalPromise;
  }
  then(func) {
    if (this.internalPromise) {
      this.internalPromise = this.internalPromise.then(func);
    } else {
      this.thenQueue.push(func);
    }
    return this; // allow chaining
  }
  catch(func) {
    if (this.internalPromise) {
      this.internalPromise = this.internalPromise.catch(func);
    } else {
      this.catchQueue.push(func);
    }
    return this; // allow chaining
  }
}
/**
 * Creates an immutable series loader object which loads each series sequentially using the iterator interface.
 *
 * @param {DICOMWebClient} dicomWebClient The DICOMWebClient instance to be used for series load
 * @param {string} studyInstanceUID The Study Instance UID from which series will be loaded
 * @param {Array} seriesInstanceUIDList A list of Series Instance UIDs
 *
 * @returns {Object} Returns an object which supports loading of instances from each of given Series Instance UID
 */
function makeSeriesAsyncLoader(client, studyInstanceUID, seriesInstanceUIDList) {
  return Object.freeze({
    hasNext() {
      return seriesInstanceUIDList.length > 0;
    },
    next() {
      const { seriesInstanceUID, metadata } = seriesInstanceUIDList.shift();
      const promise = new DeferredPromise();
      promise.setMetadata(metadata);
      promise.setProcessFunction(() => {
        return client.retrieveSeriesMetadata({
          studyInstanceUID,
          seriesInstanceUID,
        });
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
    const { studyInstanceUID, filters: { seriesInstanceUID } = {}, client } = this;

    // asking to include Series Date, Series Time, Series Description
    // and Series Number in the series metadata returned to better sort series
    // in preLoad function
    let options = {
      studyInstanceUID,
      queryParams: {
        includefield: includeField,
      },
    };

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

    return sortStudySeries(naturalized, sortCriteria, sortFunction);
  }

  async load(preLoadData) {
    const { client, studyInstanceUID } = this;

    const seriesInstanceUIDs = preLoadData.map(seriesMetadata => {
      return { seriesInstanceUID: seriesMetadata.SeriesInstanceUID, metadata: seriesMetadata };
    });

    const seriesAsyncLoader = makeSeriesAsyncLoader(client, studyInstanceUID, seriesInstanceUIDs);

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

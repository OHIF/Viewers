import dcmjs from 'dcmjs';
import {
  sortStudySeries,
  sortingCriteria,
} from '@ohif/core/src/utils/sortStudy';
import RetrieveMetadataLoader from './retrieveMetadataLoader';

/**
 * Creates an immutable series loader object which loads each series sequentially using the iterator interface
 * @param {DICOMWebClient} dicomWebClient The DICOMWebClient instance to be used for series load
 * @param {string} studyInstanceUID The Study Instance UID from which series will be loaded
 * @param {Array} seriesInstanceUIDList A list of Series Instance UIDs
 * @returns {Object} Returns an object which supports loading of instances from each of given Series Instance UID
 */
function makeSeriesAsyncLoader(
  client,
  studyInstanceUID,
  seriesInstanceUIDList
) {
  return Object.freeze({
    hasNext() {
      return seriesInstanceUIDList.length > 0;
    },
    async next() {
      const seriesInstanceUID = seriesInstanceUIDList.shift();
      return client.retrieveSeriesMetadata({
        studyInstanceUID,
        seriesInstanceUID,
      });
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
    const {
      studyInstanceUID,
      filters: { seriesInstanceUID } = {},
      client,
    } = this;

    if (seriesInstanceUID) {
      const options = {
        studyInstanceUID,
        queryParams: { SeriesInstanceUID: seriesInstanceUID },
      };
      preLoaders.push(client.searchForSeries.bind(client, options));
    }
    // Fallback preloader
    preLoaders.push(client.searchForSeries.bind(client, { studyInstanceUID }));

    yield* preLoaders;
  }

  async preLoad() {
    const preLoaders = this.getPreLoaders();
    const result = await this.runLoaders(preLoaders);
    const sortCriteria = this.sortCriteria;
    const sortFunction = this.sortFunction;

    const { naturalizeDataset } = dcmjs.data.DicomMetaDictionary;
    const naturalized = result.map(naturalizeDataset);

    return sortStudySeries(
      naturalized,
      sortCriteria ||
      sortingCriteria.seriesSortCriteria.seriesInfoSortingCriteria,
      sortFunction
    );
  }

  async load(preLoadData) {
    const { client, studyInstanceUID } = this;

    const seriesInstanceUIDs = preLoadData.map(s => s.SeriesInstanceUID);

    const seriesAsyncLoader = makeSeriesAsyncLoader(
      client,
      studyInstanceUID,
      seriesInstanceUIDs
    );

    const promises = [];

    // if a large study, fetch first a small group of series to run hanging protocol
    if (preLoadData.length > this.thresholdLargeStudy) {
      const firstGroup = [];
      while (seriesAsyncLoader.hasNext()) {
        const promise = seriesAsyncLoader.next();
        promises.push(promise);
        firstGroup.push(promise);
        if (firstGroup.length >= this.firstGroupSize) {
          break;
        }
      }
      // wait for all promises in the first group to be settled
      await Promise.allSettled(firstGroup);
    }

    while (seriesAsyncLoader.hasNext()) {
      promises.push(seriesAsyncLoader.next());
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

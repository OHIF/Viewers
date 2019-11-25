import { api } from 'dicomweb-client';
import DICOMWeb from '../../../DICOMWeb/';
import RetrieveMetadataLoader from './retrieveMetadataLoader';
import { sortStudySeries, sortingCriteria } from '../../sortStudy';
import getSeriesInfo from '../../getSeriesInfo';
import {
  createStudyFromSOPInstanceList,
  addInstancesToStudy,
} from './studyInstanceHelpers';

/**
 * Map seriesList to an array of seriesInstanceUid
 * @param {Arrays} seriesList list of Series Instance UIDs
 * @returns {Arrays} A list of Series Instance UIDs
 */
function mapStudySeries(seriesList) {
  return seriesList.map(series => getSeriesInfo(series).seriesInstanceUid);
}

function attachSeriesLoader(server, study, seriesLoader) {
  study.seriesLoader = Object.freeze({
    hasNext() {
      return seriesLoader.hasNext();
    },
    async next() {
      const series = await seriesLoader.next();
      await addInstancesToStudy(server, study, series.sopInstances);
      return study.seriesMap[series.seriesInstanceUID];
    },
  });
}

/**
 * Creates an immutable series loader object which loads each series sequentially using the iterator interface
 * @param {DICOMWebClient} dicomWebClient The DICOMWebClient instance to be used for series load
 * @param {string} studyInstanceUID The Study Instance UID from which series will be loaded
 * @param {Array} seriesInstanceUIDList A list of Series Instance UIDs
 * @returns {Object} Returns an object which supports loading of instances from each of given Series Instance UID
 */
function makeSeriesAsyncLoader(
  dicomWebClient,
  studyInstanceUID,
  seriesInstanceUIDList
) {
  return Object.freeze({
    hasNext() {
      return seriesInstanceUIDList.length > 0;
    },
    async next() {
      const seriesInstanceUID = seriesInstanceUIDList.shift();
      const sopInstances = await dicomWebClient.retrieveSeriesMetadata({
        studyInstanceUID,
        seriesInstanceUID,
      });
      return { studyInstanceUID, seriesInstanceUID, sopInstances };
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
  configLoad() {
    const { server } = this;

    const client = new api.DICOMwebClient({
      url: server.qidoRoot,
      headers: DICOMWeb.getAuthorizationHeader(server),
    });

    this.client = client;
  }

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

    const seriesSorted = sortStudySeries(
      result,
      sortingCriteria.seriesSortCriteria.seriesInfoSortingCriteria
    );
    const seriesInstanceUidsMap = mapStudySeries(seriesSorted);

    return seriesInstanceUidsMap;
  }

  async load(preLoadData) {
    const { client, studyInstanceUID } = this;

    const seriesAsyncLoader = makeSeriesAsyncLoader(
      client,
      studyInstanceUID,
      preLoadData
    );

    const firstSeries = await seriesAsyncLoader.next();

    return {
      sopInstances: firstSeries.sopInstances,
      asyncLoader: seriesAsyncLoader,
    };
  }

  async posLoad(loadData) {
    const { server } = this;

    const { sopInstances, asyncLoader } = loadData;

    const study = await createStudyFromSOPInstanceList(server, sopInstances);

    if (asyncLoader.hasNext()) {
      attachSeriesLoader(server, study, asyncLoader);
    }

    return study;
  }
}

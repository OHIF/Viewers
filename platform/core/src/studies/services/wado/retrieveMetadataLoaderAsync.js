import { api } from 'dicomweb-client';
import DICOMWeb from '../../../DICOMWeb/';
import RetrieveMetadataLoader from './retrieveMetadataLoader';
import { sortStudySeries, sortingCriteria } from '../../sortStudy';
import getSeriesInfo from '../../getSeriesInfo';
import * as StudyUtils from '../../studyUtils';

/**
 * Search series of a given study
 * @param {DICOMwebClient} client Dicomweb client api
 * @param {string} studyInstanceUID The Study Instance UID to search series from;
 * @returns {Arrays} A list of Series Instances
 */
async function searchStudySeries(client, studyInstanceUID) {
  const seriesList = await client.searchForSeries({ studyInstanceUID });
  return seriesList;
}

/**
 * Filter seriesList
 * @param {Arrays} seriesList list of Series Instance UIDs
 * @param {Object} filters object containing filter to be applied.
 * @returns {Arrays} A list of Series Instances
 */
function filterStudySeries(seriesList = [], filters) {
  let result = [...seriesList];
  const { seriesInstanceUID: toCompare } = filters;

  const compare = (valueToCompare, series) => {
    const seriesInstanceUID = DICOMWeb.getString(series['0020000E']);
    return valueToCompare === seriesInstanceUID;
  };

  if (toCompare) {
    result = result.filter(series => compare(toCompare, series));
  }

  return result;
}

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
      await StudyUtils.addInstancesToStudy(server, study, series.sopInstances);
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
  async preLoad() {
    const { client, studyInstanceUID, filters } = this;

    const seriesInstanceUIDs = await searchStudySeries(
      client,
      studyInstanceUID
    );
    const filtered = filterStudySeries(seriesInstanceUIDs, filters);
    const seriesToSort =
      filtered && filtered.length ? filtered : seriesInstanceUIDs;
    const seriesSorted = sortStudySeries(
      seriesToSort,
      sortingCriteria.seriesSortCriteria.seriesInfoSortingCriteria
    );
    const seriesInstanceUIDsMap = mapStudySeries(seriesSorted);

    return seriesInstanceUIDsMap;
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

    const study = await StudyUtils.createStudyFromSOPInstanceList(
      server,
      sopInstances
    );

    if (asyncLoader.hasNext()) {
      attachSeriesLoader(server, study, asyncLoader);
    }

    return study;
  }
}

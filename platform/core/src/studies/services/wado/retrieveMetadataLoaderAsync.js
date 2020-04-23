import { api } from 'dicomweb-client';
import dcmjs from 'dcmjs';
import DICOMWeb from '../../../DICOMWeb/';
import RetrieveMetadataLoader from './retrieveMetadataLoader';
import { sortStudySeries, sortingCriteria } from '../../sortStudy';
import getSeriesInfo from '../../getSeriesInfo';
import {
  createStudyFromSOPInstanceList,
  addInstancesToStudy,
} from './studyInstanceHelpers';

import errorHandler from '../../../errorHandler';

const { naturalizeDataset } = dcmjs.data.DicomMetaDictionary;

/**
 * Map series to an array of SeriesInstanceUID
 * @param {Arrays} series list of Series Instance UIDs
 * @returns {Arrays} A list of Series Instance UIDs
 */
function mapStudySeries(series) {
  return series.map(series => getSeriesInfo(series).SeriesInstanceUID);
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
      errorInterceptor: errorHandler.getHTTPErrorHandler(),
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

    // seriesData is the result of the QIDO-RS Search For Series request
    // It's an array of Objects containing DICOM Tag values at the Series level
    const seriesData = await this.runLoaders(preLoaders);

    const seriesSorted = sortStudySeries(
      seriesData,
      sortingCriteria.seriesSortCriteria.seriesInfoSortingCriteria
    );
    const seriesInstanceUIDsMap = mapStudySeries(seriesSorted);

    return {
      seriesInstanceUIDsMap,
      seriesData,
    };
  }

  async load(preLoadData) {
    const { client, studyInstanceUID } = this;

    const seriesAsyncLoader = makeSeriesAsyncLoader(
      client,
      studyInstanceUID,
      preLoadData.seriesInstanceUIDsMap
    );

    const firstSeries = await seriesAsyncLoader.next();

    return {
      sopInstances: firstSeries.sopInstances,
      asyncLoader: seriesAsyncLoader,
      seriesData: preLoadData.seriesData,
    };
  }

  async posLoad(loadData) {
    const { server } = this;

    const { sopInstances, asyncLoader, seriesData } = loadData;

    const study = await createStudyFromSOPInstanceList(server, sopInstances);

    // TODO: Should this be in a helper
    const seriesDataNaturalized = seriesData.map(naturalizeDataset);

    seriesDataNaturalized.forEach((series, idx) => {
      const seriesDataFromQIDO = {
        SeriesInstanceUID: series.SeriesInstanceUID,
        SeriesDescription: series.SeriesDescription,
        SeriesNumber: series.SeriesNumber,
        Modality: series.Modality,
        instances: [],
      };

      if (study.series[idx]) {
        study.series[idx] = Object.assign(
          seriesDataFromQIDO,
          study.series[idx]
        );
      } else {
        study.series[idx] = seriesDataFromQIDO;
      }

      study.seriesMap[series.SeriesInstanceUID] = study.series[idx];
    });

    if (asyncLoader.hasNext()) {
      attachSeriesLoader(server, study, asyncLoader);
    }

    return study;
  }
}

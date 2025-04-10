// import { api } from 'dicomweb-client';
// import DICOMWeb from '../../../DICOMWeb/';
import RetrieveMetadataLoader from './retrieveMetadataLoader';

/**
 * Class for sync load of study metadata.
 * It inherits from RetrieveMetadataLoader
 *
 * A list of loaders (getLoaders) can be created so, it will be applied a fallback load strategy.
 * I.e Retrieve metadata using all loaders possibilities.
 */
export default class RetrieveMetadataLoaderSync extends RetrieveMetadataLoader {
  getOptions() {
    const { studyInstanceUID, filters } = this;

    const options = {
      studyInstanceUID,
      queryParams: {
        includefield: 'all', // Request all DICOM tags instead of a subset
      },
    };

    const { seriesInstanceUID } = filters;
    if (seriesInstanceUID) {
      options['seriesInstanceUID'] = seriesInstanceUID;
    }

    return options;
  }

  /**
   * @returns {Array} Array of loaders. To be consumed as queue
   */
  *getLoaders() {
    const loaders = [];
    const { studyInstanceUID, filters: { seriesInstanceUID } = {}, client } = this;
    
    // Query params to retrieve all DICOM tags
    const queryParams = {
      includefield: 'all',
    };

    if (seriesInstanceUID) {
      loaders.push(
        client.retrieveSeriesMetadata.bind(client, {
          studyInstanceUID,
          seriesInstanceUID,
          queryParams,
        })
      );
    }

    loaders.push(client.retrieveStudyMetadata.bind(client, { 
      studyInstanceUID,
      queryParams,
    }));

    yield* loaders;
  }

  async load(preLoadData) {
    const loaders = this.getLoaders();
    const result = this.runLoaders(loaders);
    return result;
  }

  async posLoad(loadData) {
    return loadData;
  }
}

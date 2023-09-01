// import { api } from 'dicomweb-client';
// import DICOMWeb from '../../../DICOMWeb/';
import { createStudyFromSOPInstanceList } from './studyInstanceHelpers';
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

    if (seriesInstanceUID) {
      loaders.push(
        client.retrieveSeriesMetadata.bind(client, {
          studyInstanceUID,
          seriesInstanceUID,
        })
      );
    }

    loaders.push(client.retrieveStudyMetadata.bind(client, { studyInstanceUID }));

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

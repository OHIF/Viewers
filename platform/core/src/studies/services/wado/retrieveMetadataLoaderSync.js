import { api } from 'dicomweb-client';
import DICOMWeb from '../../../DICOMWeb/';
import * as StudyUtils from '../../studyUtils';
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
    const { filters: { seriesInstanceUID } = {}, client } = this;

    if (seriesInstanceUID) {
      loaders.push(client.retrieveSeriesMetadata);
    }

    loaders.push(client.retrieveStudyMetadata);

    yield* loaders;
  }

  configLoad() {
    const { server } = this;
    const client = new api.DICOMwebClient({
      url: server.wadoRoot,
      headers: DICOMWeb.getAuthorizationHeader(server),
    });

    this.client = client;
  }

  async load(preLoadData) {
    let result;
    const loaders = this.getLoaders();
    const options = this.getOptions();

    for (const loader of loaders) {
      try {
        result = await loader.call(this.client, options);
        break; // closes iterator in case data is retrieved successfully
      } catch (e) {}
    }

    if (loaders.next().done && !result) {
      throw 'cant find data';
    }

    return result;
  }

  async posLoad(loadData) {
    const { server } = this;
    return await StudyUtils.createStudyFromSOPInstanceList(server, loadData);
  }
}

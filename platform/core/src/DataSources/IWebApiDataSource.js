import { dicomMetadataStore } from '@ohif/core';

/**
 * Factory function that creates a new "Web API" data source.
 * A "Web API" data source is any source that fetches data over
 * HTTP. This function serves as an "adapter" to wrap those calls
 * so that all "Web API" data sources have the same interface and can
 * be used interchangeably.
 *
 * It's worth noting that a single implementation of this interface
 * can define different underlying sources for "read" and "write" operations.
 */
function create({ query, retrieve, getImageIdsForDisplaySet }) {
  const defaultQuery = {
    studies: {
      /**
       * @param {string} params.patientName
       * @param {string} params.mrn
       * @param {object} params.studyDate
       * @param {string} params.description
       * @param {string} params.modality
       * @param {string} params.accession
       * @param {string} params.sortBy
       * @param {string} params.sortDirection -
       * @param {number} params.page
       * @param {number} params.resultsPerPage
       */
      mapParams: params => params,
      requestResults: () => {},
      processResults: results => results,
    },
    series: {},
    instances: {},
  };

  const defaultRetrieve = {
    series: {},
  };

  return {
    query: query || defaultQuery,
    retrieve: retrieve || defaultRetrieve,
    getImageIdsForDisplaySet,
    // then go get all series level metadata.
    // Store this in the DICOM MetadataStore.
  };
}

const IWebApiDataSource = {
  create,
};

export default IWebApiDataSource;

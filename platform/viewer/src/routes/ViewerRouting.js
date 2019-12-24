import React from 'react';
import PropTypes from 'prop-types';
import ConnectedViewerRetrieveStudyData from '../connectedComponents/ConnectedViewerRetrieveStudyData';
import useServer from '../customHooks/useServer';
import OHIF from '@ohif/core';
const { urlUtil: UrlUtil } = OHIF.utils;

/**
 * Get array of seriesUIDs from param or from queryString
 * @param {*} seriesInstanceUids
 * @param {*} location
 */
const getSeriesInstanceUIDs = (seriesInstanceUids, routeLocation) => {
  const queryFilters = UrlUtil.queryString.getQueryFilters(routeLocation);
  const querySeriesUIDs = queryFilters && queryFilters['seriesInstanceUID'];
  const _seriesInstanceUids = seriesInstanceUids || querySeriesUIDs;

  return UrlUtil.paramString.parseParam(_seriesInstanceUids);
};

function ViewerRouting({ match: routeMatch, location: routeLocation }) {
  const {
    project,
    location,
    dataset,
    dicomStore,
    studyInstanceUids,
    seriesInstanceUids,
  } = routeMatch.params;
  const server = useServer({ project, location, dataset, dicomStore });

  const studyUids = UrlUtil.paramString.parseParam(studyInstanceUids);
  const seriesUids = getSeriesInstanceUIDs(seriesInstanceUids, routeLocation);

  if (server && studyUids) {
    return (
      <ConnectedViewerRetrieveStudyData
        studyInstanceUids={studyUids}
        seriesInstanceUids={seriesUids}
      />
    );
  }

  return null;
}

ViewerRouting.propTypes = {
  match: PropTypes.shape({
    params: PropTypes.shape({
      studyInstanceUids: PropTypes.string.isRequired,
      seriesInstanceUids: PropTypes.string,
      dataset: PropTypes.string,
      dicomStore: PropTypes.string,
      location: PropTypes.string,
      project: PropTypes.string,
    }),
  }),
};

export default ViewerRouting;

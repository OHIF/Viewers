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
const getSeriesUIDS = (seriesInstanceUids, location) => {
  const queryFilters = UrlUtil.queryString.getQueryFilters(location);
  const querySeriesUIDs = queryFilters['seriesInstanceUid'];
  const _seriesInstanceUids = seriesInstanceUids || querySeriesUIDs;

  return UrlUtil.paramString.parseParam(_seriesInstanceUids);
};

function ViewerRouting({ match: routeMatch, location: routeLocation }) {
  const {
    project,
    location,
    dataset,
    dicomstore,
    studyInstanceUids,
    seriesInstanceUids,
  } = routeMatch.params;

  const server = useServer({ project, location, dataset, dicomstore });

  const studyUIDs = UrlUtil.paramString.parseParam(studyInstanceUids);
  const seriesUIDs = getSeriesUIDS(seriesInstanceUids, routeLocation);

  if (server && studyUIDs) {
    return (
      <ConnectedViewerRetrieveStudyData
        studyInstanceUids={studyUIDs}
        seriesInstanceUids={seriesUIDs}
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
      dicomstore: PropTypes.string,
      location: PropTypes.string,
      project: PropTypes.string,
    }),
  }),
};

export default ViewerRouting;

import React from 'react';
import PropTypes from 'prop-types';
import { utils, user } from '@ohif/core';
//
import ConnectedViewerRetrieveStudyData from '../connectedComponents/ConnectedViewerRetrieveStudyData';
import useServer from '../customHooks/useServer';
import useQuery from '../customHooks/useQuery';
const { urlUtil: UrlUtil } = utils;

/**
 * Get array of seriesUIDs from param or from queryString
 * @param {*} seriesInstanceUIDs
 * @param {*} sopInstanceUID - SOPInstanceUID to be loaded first
 * @param {*} location
 */
const getInstanceUIDs = (seriesInstanceUIDs, sopInstanceUID, routeLocation) => {
  const queryFilters = UrlUtil.queryString.getQueryFilters(routeLocation);
  const querySeriesUIDs = queryFilters && queryFilters['seriesInstanceUID'];
  const querySOPUID = queryFilters && queryFilters['sopInstanceUID'];
  const seriesUIDs = UrlUtil.paramString.parseParam(
    seriesInstanceUIDs || querySeriesUIDs
  );
  let sopUID = UrlUtil.paramString.parseParam(sopInstanceUID || querySOPUID);

  if (sopUID && sopUID.length > 0) {
    sopUID = sopUID[0];
  } else {
    sopUID = undefined;
  }

  return {
    seriesUIDs,
    sopUID,
  };
};

function ViewerRouting({ match: routeMatch, location: routeLocation }) {
  const {
    project,
    location,
    dataset,
    dicomStore,
    studyInstanceUIDs,
    seriesInstanceUIDs,
    sopInstanceUID,
  } = routeMatch.params;
  const server = useServer({ project, location, dataset, dicomStore });
  const studyUIDs = UrlUtil.paramString.parseParam(studyInstanceUIDs);
  const { seriesUIDs, sopUID } = getInstanceUIDs(
    seriesInstanceUIDs,
    sopInstanceUID,
    routeLocation
  );

  if (server && studyUIDs) {
    return (
      <ConnectedViewerRetrieveStudyData
        studyInstanceUIDs={studyUIDs}
        seriesInstanceUIDs={seriesUIDs}
        sopInstanceUID={sopUID}
      />
    );
  }

  return null;
}

ViewerRouting.propTypes = {
  match: PropTypes.shape({
    params: PropTypes.shape({
      studyInstanceUIDs: PropTypes.string.isRequired,
      seriesInstanceUIDs: PropTypes.string,
      dataset: PropTypes.string,
      dicomStore: PropTypes.string,
      location: PropTypes.string,
      project: PropTypes.string,
    }),
  }),
  location: PropTypes.any,
};

export default ViewerRouting;

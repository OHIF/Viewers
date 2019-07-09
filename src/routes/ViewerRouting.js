import React from 'react';
import PropTypes from 'prop-types';
import ConnectedViewerRetrieveStudyData from '../connectedComponents/ConnectedViewerRetrieveStudyData';

function ViewerRouting({ match }) {
  const { studyInstanceUids, seriesInstanceUids } = match.params;

  let studyUIDs;
  let seriesUIDs;

  if (studyInstanceUids && !seriesInstanceUids) {
    studyUIDs = studyInstanceUids.split(';');
  } else if (studyInstanceUids && seriesInstanceUids) {
    studyUIDs = [studyInstanceUids];
    seriesUIDs = match.params.seriesInstanceUids.split(';');
  }

  return (
    <ConnectedViewerRetrieveStudyData
      studyInstanceUids={studyUIDs}
      seriesInstanceUids={seriesUIDs}
    />
  );
}

ViewerRouting.propTypes = {
  match: PropTypes.shape({
    params: PropTypes.shape({
      studyInstanceUids: PropTypes.string.isRequired,
      seriesInstanceUids: PropTypes.string,
    }),
  }),
};

export default ViewerRouting;

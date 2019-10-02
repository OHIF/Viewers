import React from 'react';
import PropTypes from 'prop-types';
import ConnectedViewerRetrieveStudyData from '../connectedComponents/ConnectedViewerRetrieveStudyData';
import useServer from '../customHooks/useServer';

const getUIDs = uids => {
  if (uids && typeof uids === 'string') {
    return uids.split(';');
  }
};

function ViewerRouting({ match }) {
  const {
    project,
    location,
    dataset,
    dicomstore,
    studyInstanceUids,
    seriesInstanceUids,
  } = match.params;
  const server = useServer({ project, location, dataset, dicomstore });

  const studyUIDs = getUIDs(studyInstanceUids);
  const seriesUIDs = getUIDs(seriesInstanceUids);

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

import React from 'react';
import PropTypes from 'prop-types';
import ConnectedStudyList from './ConnectedStudyList';

// TODO: Move to react-viewerbase

function StudyListRouting({ match }) {
  // TODO: Figure out which filters we want to pass in via a URL
  //const { patientId } = match.params;

  return <ConnectedStudyList />;
}

StudyListRouting.propTypes = {
  match: PropTypes.shape({
    params: PropTypes.shape({
      patientIds: PropTypes.string,
    }),
  }),
};

export default StudyListRouting;

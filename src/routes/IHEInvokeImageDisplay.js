import React from 'react';
import PropTypes from 'prop-types';
import { withRouter } from 'react-router-dom';
import queryString from 'query-string';
import ConnectedViewerRetrieveStudyData from '../connectedComponents/ConnectedViewerRetrieveStudyData.js';

function decodeStudyUids(studyUids) {
  const decodedData = window.atob(studyUids);

  return decodedData.split(';');
}

function getQueryParameters(location) {
  if (location) {
    return queryString.parse(location.search);
  }

  return {};
}

function IHEInvokeImageDisplay({ location }) {
  const {
    // patientID,
    requestType,
    studyUID,
  } = getQueryParameters(location);

  switch (requestType) {
    case 'STUDY':
      return (
        <ConnectedViewerRetrieveStudyData
          studyInstanceUids={studyUID.split(';')}
        />
      );

    case 'STUDYBASE64':
      return (
        <ConnectedViewerRetrieveStudyData
          studyInstanceUids={decodeStudyUids(studyUID)}
        />
      );

    case 'PATIENT':
      // TODO: connect this to the StudyList when we have the filter parameters set up
      // return <StudyList patientUids={patientID.split(';')} />;
      return '';

    default:
      // TODO: Figure out what to do here, this won't work because StudyList expects studies
      // return <StudyList />;
      return '';
  }
}

IHEInvokeImageDisplay.propTypes = {
  location: PropTypes.shape({
    search: PropTypes.string,
  }).isRequired,
};

export default withRouter(IHEInvokeImageDisplay);

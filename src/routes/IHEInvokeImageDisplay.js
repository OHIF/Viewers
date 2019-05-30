import React from 'react';
import PropTypes from 'prop-types';
import ViewerRetrieveStudyData from '../connectedComponents/ViewerRetrieveStudyData.js';

function IHEInvokeImageDisplay({ match }) {
  const requestType = match.params.query.requestType;
  let studyInstanceUids;
  //let patientUids;
  let displayStudyList = false;

  if (requestType === 'STUDY') {
    studyInstanceUids = match.params.query.studyUID.split(';');
  } else if (requestType === 'STUDYBASE64') {
    const uids = this.params.query.studyUID;
    const decodedData = window.atob(uids);
    studyInstanceUids = decodedData.split(';');
  } else if (requestType === 'PATIENT') {
    //patientUidspatientUids = this.params.query.patientID.split(';');
    displayStudyList = true;
  } else {
    displayStudyList = true;
  }

  if (displayStudyList) {
    return ''; //<StudyList patientUids={patientUids}/>);
  }

  return <ViewerRetrieveStudyData studyInstanceUids={studyInstanceUids} />;
}

IHEInvokeImageDisplay.propTypes = {
  match: PropTypes.shape({
    params: PropTypes.shape({
      query: PropTypes.shape({
        requestType: PropTypes.string.isRequired,
        studyUID: PropTypes.string,
        patientID: PropTypes.string,
      }),
    }),
  }),
};

export default IHEInvokeImageDisplay;

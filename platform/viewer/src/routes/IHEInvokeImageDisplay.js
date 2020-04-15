import React from 'react';
import PropTypes from 'prop-types';
import { withRouter } from 'react-router-dom';
import ConnectedViewerRetrieveStudyData from '../connectedComponents/ConnectedViewerRetrieveStudyData.js';
import OHIF from '@ohif/core';
const { urlUtil: UrlUtil } = OHIF.utils;

function IHEInvokeImageDisplay({ location }) {
  const {
    // patientID,
    requestType,
    studyUID,
  } = UrlUtil.parse(location.search);

  switch (requestType) {
    case 'STUDY':
      return (
        <ConnectedViewerRetrieveStudyData
          studyInstanceUIDs={studyUID.split(';')}
        />
      );

    case 'STUDYBASE64':
      return (
        <ConnectedViewerRetrieveStudyData
          studyInstanceUIDs={UrlUtil.paramString.parseParam(studyUID)}
        />
      );

    case 'PATIENT':
      // TODO: connect this to the StudyList when we have the filter parameters set up
      // return <StudyList patientUIDs={patientID.split(';')} />;
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

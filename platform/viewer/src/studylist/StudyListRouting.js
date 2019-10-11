import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { withRouter } from 'react-router-dom';
import ConnectedStudyList from './ConnectedStudyList';

import OHIF from '@ohif/core';
const { urlUtil: UrlUtil } = OHIF.utils;

// Contexts
import AppContext from '../context/AppContext';

function StudyListRouting({ location }) {
  const { appConfig = {} } = useContext(AppContext);

  const filters = UrlUtil.queryString.getQueryFilters(location);

  let studyListFunctionsEnabled = false;
  if (appConfig.studyListFunctionsEnabled) {
    studyListFunctionsEnabled = appConfig.studyListFunctionsEnabled;
  }
  return (
    <ConnectedStudyList
      filters={filters}
      studyListFunctionsEnabled={studyListFunctionsEnabled}
    />
  );
}

StudyListRouting.propTypes = {
  location: PropTypes.shape({
    search: PropTypes.string,
  }).isRequired,
};

export default withRouter(StudyListRouting);

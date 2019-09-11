import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { withRouter } from 'react-router-dom';
import queryString from 'query-string';
import ConnectedStudyList from './ConnectedStudyList';

// Contexts
import AppContext from '../context/AppContext';

// TODO: Move to @ohif/ui

function toLowerCaseFirstLetter(word) {
  return word[0].toLowerCase() + word.slice(1);
}

function getFilters({ search }) {
  const searchParameters = queryString.parse(search);
  const filters = {};

  Object.entries(searchParameters).forEach(([key, value]) => {
    filters[toLowerCaseFirstLetter(key)] = value;
  });

  return filters;
}

function StudyListRouting({ location }) {
  const { appConfig = {} } = useContext(AppContext);

  const filters = location ? getFilters(location) : undefined;

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

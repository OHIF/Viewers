import React from 'react';
import PropTypes from 'prop-types';
import { withRouter } from 'react-router-dom';
import queryString from 'query-string';
import ConnectedStudyList from './ConnectedStudyList';

// TODO: Move to react-viewerbase

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
  const filters = location ? getFilters(location) : undefined;

  return <ConnectedStudyList filters={filters} />;
}

StudyListRouting.propTypes = {
  location: PropTypes.shape({
    search: PropTypes.string,
  }).isRequired,
};

export default withRouter(StudyListRouting);

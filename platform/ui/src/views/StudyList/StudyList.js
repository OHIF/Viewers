import React from 'react';
import PropTypes from 'prop-types';

import Header from './components/Header';
import StudyListFilter from './components/StudyListFilter';
import StudyListTable from './components/StudyListTable';
import StudyListPagination from './components/StudyListPagination';

import studyListMock from '../../mocks/studyList.json';

const DEFAULT_MOCKED_STUDIES_AMOUNT = 50;

const StudyList = ({ studies }) => {
  console.log('studies', studies);
  return (
    <div>
      <Header />
      <StudyListFilter />
      <StudyListTable />
      <StudyListPagination />
    </div>
  );
};

const getMockedStudies = () => {
  const urlParams = new URLSearchParams(window.location.search);

  if (!urlParams) {
    return new Array(DEFAULT_MOCKED_STUDIES_AMOUNT).fill(
      studyListMock.studies[0]
    );
  }

  const myParam = urlParams.get('studiesAmount');
};

StudyList.defaultProps = {
  studies: studyListMock.studies,
};

StudyList.propTypes = {
  studies: PropTypes.object,
};

export default StudyList;

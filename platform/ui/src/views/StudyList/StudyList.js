import React from 'react';
import PropTypes from 'prop-types';

import Header from './components/Header';
import StudyListFilter from './components/StudyListFilter';
import StudyListTable from './components/StudyListTable';
import StudyListPagination from './components/StudyListPagination';

import studyListMock from '../../mocks/studyList.json';

/** Values can be env vars */
const DEFAULT_MOCKED_STUDIES_NUM = 50;
const DEFAULT_MOCKED_STUDIES_LIMIT = 1000;

const StudyList = ({ studies, perPage }) => {
  const studiesData = studies.slice(0, perPage);
  const numOfStudies = studies.length;
  return (
    <div className="bg-black h-screen">
      <Header />
      <StudyListFilter numOfStudies={numOfStudies} />
      <StudyListTable studies={studiesData} numOfStudies={numOfStudies} />
      {numOfStudies > 0 && <StudyListPagination />}
    </div>
  );
};

const getMockedStudies = () => {
  const urlParams = new URLSearchParams(window.location.search);
  const generateData = num => new Array(+num).fill(studyListMock.studies[0]);
  const defaultStudiesNum =
    DEFAULT_MOCKED_STUDIES_NUM > DEFAULT_MOCKED_STUDIES_LIMIT
      ? DEFAULT_MOCKED_STUDIES_LIMIT
      : DEFAULT_MOCKED_STUDIES_NUM;

  if (!urlParams) {
    return generateData(defaultStudiesNum);
  }

  const studiesNum = urlParams.get('studiesNum') || defaultStudiesNum;

  return generateData(studiesNum);
};

StudyList.defaultProps = {
  studies: getMockedStudies(),
  perPage: 25,
};

StudyList.propTypes = {
  studies: PropTypes.array,
  perPage: PropTypes.number,
};

export default StudyList;

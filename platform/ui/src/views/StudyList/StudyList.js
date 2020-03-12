import React from 'react';
import PropTypes from 'prop-types';

import Header from './components/Header';
import StudyListFilter from './components/StudyListFilter';
import StudyListTable from './components/StudyListTable';
import StudyListPagination from './components/StudyListPagination';

import { getMockedStudies } from '../../utils/';

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

StudyList.defaultProps = {
  studies: getMockedStudies(),
  perPage: 25,
};

StudyList.propTypes = {
  studies: PropTypes.array,
  perPage: PropTypes.number,
};

export default StudyList;

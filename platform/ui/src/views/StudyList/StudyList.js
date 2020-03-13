import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

import Header from './components/Header';
import StudyListFilter from './components/StudyListFilter';
import StudyListTable from './components/StudyListTable';
import StudyListPagination from './components/StudyListPagination';

const StudyList = ({ studies, perPage }) => {
  const studiesData = studies.slice(0, perPage);
  const numOfStudies = studies.length;
  const isEmptyStudies = numOfStudies === 0;
  return (
    <div
      className={classnames('bg-black h-full', {
        'h-screen': isEmptyStudies,
      })}
    >
      <Header />
      <StudyListFilter numOfStudies={numOfStudies} />
      <StudyListTable studies={studiesData} numOfStudies={numOfStudies} />
      {!isEmptyStudies && <StudyListPagination />}
    </div>
  );
};

StudyList.defaultProps = {
  studies: [],
  perPage: 25,
};

StudyList.propTypes = {
  studies: PropTypes.array,
  perPage: PropTypes.number,
};

export default StudyList;

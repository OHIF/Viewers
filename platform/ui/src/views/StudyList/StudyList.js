import React from 'react';
import Header from './components/Header';
import StudyListFilter from './components/StudyListFilter';
import StudyListTable from './components/StudyListTable';
import StudyListPagination from './components/StudyListPagination';

const StudyList = () => {
  return (
    <div>
      <Header />
      <StudyListFilter onFilterChange={() => {}} />
      <StudyListTable />
      <StudyListPagination />
    </div>
  );
};

export default StudyList;

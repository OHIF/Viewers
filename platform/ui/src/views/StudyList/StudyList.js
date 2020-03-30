import React, { useState } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

import Header from './components/Header';
import StudyListFilter from './components/StudyListFilter';
import StudyListTable from './components/StudyListTable';
import StudyListPagination from './components/StudyListPagination';

const filtersMeta = [
  {
    name: 'patientName',
    displayName: 'Patient Name',
    inputType: 'Text',
    isSortable: true,
    gridCol: 4,
  },
  {
    name: 'mrn',
    displayName: 'MRN',
    inputType: 'Text',
    isSortable: true,
    gridCol: 2,
  },
  {
    name: 'studyDate',
    displayName: 'Study date',
    inputType: 'DateRange',
    isSortable: true,
    gridCol: 5,
  },
  {
    name: 'description',
    displayName: 'Description',
    inputType: 'Text',
    isSortable: true,
    gridCol: 4,
  },
  {
    name: 'modality',
    displayName: 'Modality',
    inputType: 'MultiSelect',
    inputProps: {
      options: [
        { value: 'SEG', label: 'SEG' },
        { value: 'CT', label: 'CT' },
        { value: 'MR', label: 'MR' },
        { value: 'SR', label: 'SR' },
      ],
    },
    isSortable: true,
    gridCol: 3,
  },
  {
    name: 'accession',
    displayName: 'Accession',
    inputType: 'Text',
    isSortable: true,
    gridCol: 4,
  },
  {
    name: 'instances',
    displayName: 'Instances',
    inputType: 'None',
    isSortable: true,
    gridCol: 2,
  },
];

const defaultFilterValues = {
  patientName: '',
  mrn: '',
  studyDate: {
    startDate: null,
    endDate: null,
  },
  description: '',
  modality: undefined,
  accession: '',
  sortBy: '',
  sortDirection: 'none',
  page: 0,
  resultsPerPage: 25,
};

const isFiltering = (filterValues, defaultFilterValues) => {
  return Object.keys(defaultFilterValues).some(name => {
    return filterValues[name] !== defaultFilterValues[name];
  });
};

const StudyList = ({ studies, perPage }) => {
  const [filterValues, setFilterValues] = useState(defaultFilterValues);
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
      <StudyListFilter
        numOfStudies={numOfStudies}
        filtersMeta={filtersMeta}
        filterValues={filterValues}
        setFilterValues={setFilterValues}
        clearFilters={() => setFilterValues(defaultFilterValues)}
        isFiltering={isFiltering(filterValues, defaultFilterValues)}
      />
      <StudyListTable
        studies={studiesData}
        numOfStudies={numOfStudies}
        filtersMeta={filtersMeta}
      />
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

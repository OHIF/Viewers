import React from 'react';
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
    inputType: 'text',
    isSortable: true,
    gridCol: 4,
  },
  {
    name: 'mrn',
    displayName: 'MRN',
    inputType: 'text',
    isSortable: true,
    gridCol: 2,
  },
  {
    name: 'studyDate',
    displayName: 'Study date',
    inputType: 'date-range',
    isSortable: true,
    gridCol: 5,
  },
  {
    name: 'description',
    displayName: 'Description',
    inputType: 'text',
    isSortable: true,
    gridCol: 4,
  },
  {
    name: 'modality',
    displayName: 'Modality',
    inputType: 'select',
    selectOptions: [
      { value: 'seg', label: 'seg' },
      { value: 'ct', label: 'ct' },
      { value: 'mr', label: 'mr' },
      { value: 'sr', label: 'sr' },
    ],
    isSortable: true,
    gridCol: 3,
  },
  {
    name: 'accession',
    displayName: 'Accession',
    inputType: 'text',
    isSortable: true,
    gridCol: 4,
  },
  {
    name: 'instances',
    displayName: 'Instances',
    inputType: 'none',
    isSortable: false,
    gridCol: 2,
  },
];

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
      <StudyListFilter numOfStudies={numOfStudies} filtersMeta={filtersMeta} />
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

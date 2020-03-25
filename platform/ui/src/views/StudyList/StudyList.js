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
    inputType: 'Select',
    inputProps: {
      options: [
        { value: 'SEG', label: 'SEG' },
        { value: 'CT', label: 'CT' },
        { value: 'MR', label: 'MR' },
        { value: 'SR', label: 'SR' },
      ],
      isMulti: true,
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

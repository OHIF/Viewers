import React from 'react';
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
    inputType: 'text',
    isSortable: true,
    gridCol: 4,
  },
  {
    name: 'description',
    displayName: 'Description',
    inputType: 'text',
    isSortable: true,
    gridCol: 5,
  },
  {
    name: 'modality',
    displayName: 'Modality',
    inputType: 'text',
    isSortable: true,
    gridCol: 3,
  },
  {
    name: 'accession',
    displayName: 'Accession',
    inputType: 'text',
    isSortable: true,
    gridCol: 3,
  },
  {
    name: 'instances',
    displayName: 'Instances',
    inputType: 'none',
    isSortable: false,
    gridCol: 3,
  },
];

const StudyList = () => {
  return (
    <div>
      <Header />
      <StudyListFilter filtersMeta={filtersMeta} />
      <StudyListTable filtersMeta={filtersMeta} />
      <StudyListPagination />
    </div>
  );
};

export default StudyList;

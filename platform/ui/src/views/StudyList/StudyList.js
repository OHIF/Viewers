import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

import { EmptyStudies } from '@ohif/ui';

// fix imports after refactor
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

const StudyList = ({ numOfStudies, tableDataSource, paginationData }) => {
  const hasStudies = numOfStudies > 0;

  return (
    <div
      className={classnames('bg-black h-full', {
        'h-screen': !hasStudies,
      })}
    >
      <Header />
      <StudyListFilter numOfStudies={numOfStudies} filtersMeta={filtersMeta} />

      {hasStudies ? (
        <>
          <StudyListTable
            tableDataSource={tableDataSource}
            numOfStudies={numOfStudies}
            filtersMeta={filtersMeta}
          />
          <StudyListPagination paginationData={paginationData} />
        </>
      ) : (
        <div className="flex flex-col items-center justify-center pt-48">
          <EmptyStudies />
        </div>
      )}
    </div>
  );
};

StudyList.defaultProps = {
  tableDataSource: [],
};

StudyList.propTypes = {
  tableDataSource: PropTypes.arrayOf(
    PropTypes.shape({
      row: PropTypes.object.isRequired,
      expandedContent: PropTypes.node.isRequired,
      onClickRow: PropTypes.func.isRequired,
      isExpanded: PropTypes.bool.isRequired,
    })
  ),
  numOfStudies: PropTypes.number.isRequired,
  paginationData: PropTypes.shape({
    onChangePage: PropTypes.func,
    currentPage: PropTypes.number,
  }).isRequired,
};

export default StudyList;

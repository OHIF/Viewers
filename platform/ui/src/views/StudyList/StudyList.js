/**
 * THIS IS A TEMPORARY FILE -- SHOULD BE REMOVED
 */
import React, { useState } from 'react';
import classnames from 'classnames';
import moment from 'moment';

import {
  EmptyStudies,
  Icon,
  StudyListExpandedRow,
  Button,
  StudyListPagination,
  StudyListTable,
  StudyListFilter,
} from '../../components';
import utils from '../../utils';

// fix imports after refactor
import Header from './components/Header';

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

const StudyList = () => {
  const [filterValues, setFilterValues] = useState(defaultFilterValues);
  const studies = utils.getMockedStudies();
  const numOfStudies = studies.length;
  const [expandedRows, setExpandedRows] = useState([]);

  const tableDataSource = studies.map((study, key) => {
    const rowKey = key + 1;
    const isExpanded = expandedRows.some(k => k === rowKey);
    const {
      AccessionNumber,
      Modalities,
      Instances,
      StudyDescription,
      PatientId,
      PatientName,
      StudyDate,
      series,
    } = study;

    const seriesTableColumns = {
      description: 'Description',
      seriesNumber: 'Series',
      modality: 'Modality',
      Instances: 'Instances',
    };

    const seriesTableDataSource = series.map(seriesItem => {
      const { SeriesNumber, Modality, instances } = seriesItem;
      return {
        description: 'Patient Protocol',
        seriesNumber: SeriesNumber,
        modality: Modality,
        Instances: instances.length,
      };
    });

    return {
      row: [
        {
          key: 'patientName',
          content: PatientName,
          gridCol: 4,
        },
        {
          key: 'mrn',
          content: PatientId,
          gridCol: 2,
        },
        {
          key: 'studyDate',
          content: (
            <div>
              <span className="mr-4">
                {moment(StudyDate).format('MMM-DD-YYYY')}
              </span>
              <span>{moment(StudyDate).format('hh:mm A')}</span>
            </div>
          ),
          gridCol: 5,
        },
        {
          key: 'description',
          content: StudyDescription,
          gridCol: 4,
        },
        {
          key: 'modality',
          content: Modalities,
          gridCol: 3,
        },
        {
          key: 'accession',
          content: AccessionNumber,
          gridCol: 4,
        },
        {
          key: 'instances',
          content: (
            <>
              <Icon
                name="series-active"
                className={classnames('inline-flex mr-2', {
                  'text-primary-active': isExpanded,
                  'text-secondary-light': !isExpanded,
                })}
              />
              {Instances}
            </>
          ),
          gridCol: 4,
        },
      ],
      expandedContent: (
        <StudyListExpandedRow
          seriesTableColumns={seriesTableColumns}
          seriesTableDataSource={seriesTableDataSource}
        >
          <Button
            rounded="full"
            variant="contained"
            className="mr-4 font-bold"
            endIcon={<Icon name="launch-arrow" style={{ color: '#21a7c6' }} />}
          >
            Basic Viewer
          </Button>
          <Button
            rounded="full"
            variant="contained"
            className="mr-4 font-bold"
            endIcon={<Icon name="launch-arrow" style={{ color: '#21a7c6' }} />}
          >
            Segmentation
          </Button>
          <Button
            rounded="full"
            variant="outlined"
            endIcon={<Icon name="launch-info" />}
            className="font-bold"
          >
            Module 3
          </Button>
          <div className="ml-5 text-lg text-common-bright inline-flex items-center">
            <Icon name="notificationwarning-diamond" className="mr-2 w-5 h-5" />
            Feedback text lorem ipsum dolor sit amet
          </div>
        </StudyListExpandedRow>
      ),
      onClickRow: () =>
        setExpandedRows(s =>
          isExpanded ? s.filter(n => rowKey !== n) : [...s, rowKey]
        ),
      isExpanded,
    };
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(25);
  const totalPages = Math.floor(numOfStudies / perPage);
  const onChangePage = page => {
    if (page > totalPages) {
      return;
    }
    setCurrentPage(page);
  };
  const onChangePerPage = perPage => {
    setPerPage(perPage);
    setCurrentPage(1);
  };

  const hasStudies = numOfStudies > 0;

  return (
    <div
      className={classnames('bg-black h-full', {
        'h-screen': !hasStudies,
      })}
    >
      <Header />
      <StudyListFilter
        numOfStudies={numOfStudies}
        filtersMeta={filtersMeta}
        filterValues={filterValues}
        onChange={setFilterValues}
        clearFilters={() => setFilterValues(defaultFilterValues)}
        isFiltering={isFiltering(filterValues, defaultFilterValues)}
      />

      {hasStudies ? (
        <>
          <StudyListTable
            tableDataSource={tableDataSource}
            numOfStudies={numOfStudies}
            filtersMeta={filtersMeta}
          />
          <StudyListPagination
            onChangePage={onChangePage}
            onChangePerPage={onChangePerPage}
            currentPage={currentPage}
            perPage={perPage}
          />
        </>
      ) : (
          <div className="flex flex-col items-center justify-center pt-48">
            <EmptyStudies />
          </div>
        )}
    </div>
  );
};

export default StudyList;

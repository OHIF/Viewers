import React, { useState, useEffect } from 'react';
import classnames from 'classnames';
import { Link } from 'react-router-dom';
import moment from 'moment';

import {
  utils,
  Icon,
  StudyListExpandedRow,
  Button,
  NavBar,
  Svg,
  IconButton,
  EmptyStudies,
  StudyListTable,
  StudyListPagination,
  StudyListFilter,
} from '@ohif/ui';

// URL Query Hook
import { useQuery } from '../../hooks';

function StudyListContainer() {
  const query = useQuery();

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
  const [filterValues, setFilterValues] = useState(defaultFilterValues);
  const studies = utils.getMockedStudies(100);
  const numOfStudies = studies.length;
  const [expandedRows, setExpandedRows] = useState([]);
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
  const isFiltering = (filterValues, defaultFilterValues) => {
    return Object.keys(defaultFilterValues).some(name => {
      return filterValues[name] !== defaultFilterValues[name];
    });
  };
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
          content: (
            <>
              <Icon
                name={isExpanded ? 'chevron-down' : 'chevron-right'}
                className="mr-4"
              />
              {PatientName}
            </>
          ),
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
                name="group-layers"
                className={classnames('inline-flex mr-2 w-4', {
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
            <Link to="/viewer/123">Basic Viewer</Link>
          </Button>
          <Button
            rounded="full"
            variant="contained"
            className="mr-4 font-bold"
            endIcon={<Icon name="launch-arrow" style={{ color: '#21a7c6' }} />}
          >
            <Link to="/viewer/123">Segmentation</Link>
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

  useEffect(() => {
    query.setQueryString(filterValues);
  }, [filterValues, query]);

  return (
    <div
      className={classnames('bg-black h-full', {
        'h-screen': !hasStudies,
      })}
    >
      <NavBar className="justify-between border-b-4 border-black" isSticky>
        <div className="flex items-center">
          <div className="mx-3">
            <Svg name="logo-ohif" />
          </div>
        </div>
        <div className="flex items-center">
          <span className="mr-3 text-common-light text-lg">
            FOR INVESTIGATIONAL USE ONLY
          </span>
          <IconButton
            variant="text"
            color="inherit"
            className="text-primary-active"
            onClick={() => {}}
          >
            <React.Fragment>
              <Icon name="settings" />
              <Icon name="chevron-down" />
            </React.Fragment>
          </IconButton>
        </div>
      </NavBar>
      <StudyListFilter
        numOfStudies={numOfStudies}
        filtersMeta={filtersMeta}
        filterValues={filterValues}
        setFilterValues={setFilterValues}
        clearFilters={() => setFilterValues(defaultFilterValues)}
        isFiltering={isFiltering(filterValues, defaultFilterValues)}
      />
      {hasStudies ? (
        <>
          <StudyListTable
            tableDataSource={tableDataSource.slice(
              (currentPage - 1) * perPage,
              (currentPage - 1) * perPage + perPage
            )}
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
}

export default StudyListContainer;

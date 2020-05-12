import React, { useState, useEffect } from 'react';
import classnames from 'classnames';
import propTypes from 'prop-types';
import { Link } from 'react-router-dom';
import moment from 'moment';
import qs from 'query-string';
//
import { useDebounce, useQuery } from './../../hooks';

import {
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

/**
 * TODO:
 * - debounce `setFilterValues` (150ms?)
 */
function StudyListContainer({ history, data: studies }) {
  // ~ Filters
  const query = useQuery();
  const queryFilterValues = _getQueryFilterValues(query);
  const [filterValues, setFilterValues] = useState(
    Object.assign({}, defaultFilterValues, queryFilterValues)
  );
  const debouncedFilterValues = useDebounce(filterValues, 500);
  // ~ Rows & Studies
  const [expandedRows, setExpandedRows] = useState([]);
  const numOfStudies = studies.length;

  useEffect(() => {
    if (!debouncedFilterValues) {
      return;
    }
    const queryString = {};
    Object.keys(defaultFilterValues).forEach(key => {
      const defaultValue = defaultFilterValues[key];
      const currValue = debouncedFilterValues[key];

      if (
        typeof currValue === 'object' &&
        currValue !== null &&
        JSON.stringify(currValue) !== JSON.stringify(defaultValue)
      ) {
        queryString[key] = JSON.stringify(currValue);
      } else if (currValue !== defaultValue) {
        queryString[key] = currValue;
      }
    });
    history.push({
      pathname: '/',
      search: `?${qs.stringify(queryString, {
        skipNull: true,
        skipEmptyString: true,
      })}`,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedFilterValues]);

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
      accessionNumber,
      modalities,
      instances,
      studyDescription,
      patientId,
      patientName,
      studyDate,
      studyTime,
      // ??
      // TODO: won't have until expanded
      series = [],
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
          content: patientName
            ? patientName
            : (<span className="text-gray-700">(Empty)</span>),
          title: patientName,
          gridCol: 4,
        },
        {
          key: 'mrn',
          content: patientId,
          title: patientId,
          gridCol: 2,
        },
        {
          key: 'studyDate',
          content: (
            <div>
              <span className="mr-4">
                {moment(studyDate).format('MMM-DD-YYYY')}
              </span>
              {studyTime && (<span>{moment(studyTime, 'HHmmss.SSS').format('hh:mm A')}</span>)}
            </div>
          ),
          title: 'time',
          gridCol: 5,
        },
        {
          key: 'description',
          content: studyDescription,
          title: studyDescription,
          gridCol: 4,
        },
        {
          key: 'modality',
          content: modalities,
          title: modalities,
          gridCol: 3,
        },
        {
          key: 'accession',
          content: accessionNumber,
          title: accessionNumber,
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
              {instances}
            </>
          ),
          title: instances,
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
        onChange={setFilterValues}
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

StudyListContainer.propTypes = {
  history: propTypes.shape({
    push: propTypes.func,
  }),
  studies: propTypes.array,
};

StudyListContainer.defaultProps = {
  studies: [],
};

const defaultFilterValues = {
  patientName: '',
  mrn: '',
  studyDate: {
    startDate: null,
    endDate: null,
  },
  description: '',
  modality: [],
  accession: '',
  sortBy: '',
  sortDirection: 'none',
  page: 0,
  resultsPerPage: 25,
};

function _getQueryFilterValues(query) {
  const queryFilterValues = {
    patientName: query.get('patientName'),
    mrn: query.get('mrn'),
    studyDate: _tryParseDates(query.get('studyDate'), undefined),
    description: query.get('description'),
    modality: _tryParseJson(query.get('modality'), undefined),
    accession: query.get('accession'),
    sortBy: query.get('soryBy'),
    sortDirection: query.get('sortDirection'),
    page: _tryParseInt(query.get('page'), undefined),
    resultsPerPage: _tryParseInt(query.get('resultsPerPage'), undefined),
  };

  // Delete null/undefined keys
  Object.keys(queryFilterValues).forEach(
    key => queryFilterValues[key] == null && delete queryFilterValues[key]
  );

  return queryFilterValues;

  function _tryParseInt(str, defaultValue) {
    var retValue = defaultValue;
    if (str !== null) {
      if (str.length > 0) {
        if (!isNaN(str)) {
          retValue = parseInt(str);
        }
      }
    }
    return retValue;
  }

  function _tryParseJson(str, defaultValue) {
    return str ? JSON.parse(str) : defaultValue;
  }

  function _tryParseDates(str, defaultValue) {
    const studyDateObject = _tryParseJson(str, defaultValue);

    if (studyDateObject) {
      studyDateObject.startDate = studyDateObject.startDate
        ? moment(new Date(studyDateObject.startDate))
        : undefined;

      studyDateObject.endDate = studyDateObject.endDate
        ? moment(new Date(studyDateObject.endDate))
        : undefined;
    }

    return studyDateObject;
  }
}

export default StudyListContainer;

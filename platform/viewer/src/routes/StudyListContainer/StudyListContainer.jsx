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
  const debouncedFilterValues = useDebounce(filterValues, 200);
  const { resultsPerPage, pageNumber, sortBy, sortDirection } = filterValues;
  // ~ Rows & Studies
  const [expandedRows, setExpandedRows] = useState([]);
  const numOfStudies = studies.length;
  const totalPages = Math.floor(numOfStudies / resultsPerPage);

  const onPageNumberChange = newPageNumber => {
    if (newPageNumber > totalPages) {
      return;
    }
    setFilterValues({ ...filterValues, pageNumber: newPageNumber });
  };

  const onResultsPerPageChange = newResultsPerPage => {
    setFilterValues({
      ...filterValues,
      pageNumber: 1,
      resultsPerPage: Number(newResultsPerPage),
    });
  };

  // Set body style
  useEffect(() => {
    document.body.classList.add('bg-black');
    return () => {
      document.body.classList.remove('bg-black');
    };
  }, []);

  useEffect(() => {
    if (!debouncedFilterValues) {
      return;
    }
    const queryString = {};
    Object.keys(defaultFilterValues).forEach(key => {
      const defaultValue = defaultFilterValues[key];
      const currValue = debouncedFilterValues[key];

      // TODO: nesting/recursion?
      if (key === 'studyDate') {
        if (
          currValue.startDate &&
          defaultValue.startDate !== currValue.startDate
        ) {
          queryString.startDate = currValue.startDate;
        }
        if (currValue.endDate && defaultValue.endDate !== currValue.endDate) {
          queryString.endDate = currValue.endDate;
        }
      } else if (key === 'modalities' && currValue.length) {
        queryString.modalities = currValue.join(',');
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
      name: 'modalities',
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
  const tableDataSource = studies
    // TOOD: Move sort to DataSourceWrapper?
    .sort((s1, s2) => {
      const noSortApplied = sortBy === '' || !sortBy;
      const sortModifier = sortDirection === 'descending' ? 1 : -1;
      if (noSortApplied) {
        return 0;
      }

      const s1Prop = s1[sortBy];
      const s2Prop = s2[sortBy];

      if (typeof s1Prop === 'string' && typeof s2Prop === 'string') {
        return s1Prop.localeCompare(s2Prop) * sortModifier;
      } else if (typeof s1Prop === 'number' && typeof s2Prop === 'number') {
        return (s1Prop > s2Prop ? 1 : -1) * sortModifier;
      } else if (!s1Prop && s2Prop) {
        return -1 * sortModifier;
      } else if (!s2Prop && s1Prop) {
        return 1 * sortModifier;
      } else if (sortBy === 'studyDate') {
        // TODO: Delimiters are non-standard. Should we support them?
        const s1Date = moment(s1.date, ['YYYYMMDD', 'YYYY.MM.DD'], true);
        const s2Date = moment(s2.date, ['YYYYMMDD', 'YYYY.MM.DD'], true);

        if (s1Date.isValid() && s2Date.isValid()) {
          return (
            (s1Date.toISOString() > s2Date.toISOString() ? 1 : -1) *
            sortModifier
          );
        } else if (s1Date.isValid()) {
          return sortModifier;
        } else if (s2Date.isValid()) {
          return -1 * sortModifier;
        }
      }

      return 0;
    })
    .map((study, key) => {
      const rowKey = key + 1;
      const isExpanded = expandedRows.some(k => k === rowKey);
      const {
        accession,
        modalities,
        instances,
        description,
        mrn,
        patientName,
        date,
        time,
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
            content: patientName ? (
              patientName
            ) : (
              <span className="text-gray-700">(Empty)</span>
            ),
            title: patientName,
            gridCol: 4,
          },
          {
            key: 'mrn',
            content: mrn,
            title: mrn,
            gridCol: 2,
          },
          {
            key: 'studyDate',
            content: (
              <div>
                <span className="mr-4">
                  {date &&
                    moment(date, ['YYYYMMDD', 'YYYY.MM.DD'], true).isValid() &&
                    moment(date, ['YYYYMMDD', 'YYYY.MM.DD']).format(
                      'MMM-DD-YYYY'
                    )}
                </span>
                {time && (
                  <span>
                    {time &&
                      moment(time, [
                        'HH',
                        'HHmm',
                        'HHmmss',
                        'HHmmss.SSS',
                      ]).isValid() &&
                      moment(time, [
                        'HH',
                        'HHmm',
                        'HHmmss',
                        'HHmmss.SSS',
                      ]).format('hh:mm A')}
                  </span>
                )}
              </div>
            ),
            title: 'time',
            gridCol: 5,
          },
          {
            key: 'description',
            content: description,
            title: description,
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
            content: accession,
            title: accession,
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
            title: (instances || 0).toString(),
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
              endIcon={
                <Icon name="launch-arrow" style={{ color: '#21a7c6' }} />
              }
            >
              <Link to="/viewer/123">Basic Viewer</Link>
            </Button>
            <Button
              rounded="full"
              variant="contained"
              className="mr-4 font-bold"
              endIcon={
                <Icon name="launch-arrow" style={{ color: '#21a7c6' }} />
              }
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
              <Icon
                name="notificationwarning-diamond"
                className="mr-2 w-5 h-5"
              />
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
              (pageNumber - 1) * resultsPerPage,
              (pageNumber - 1) * resultsPerPage + resultsPerPage
            )}
            numOfStudies={numOfStudies}
            filtersMeta={filtersMeta}
          />
          <StudyListPagination
            onChangePage={onPageNumberChange}
            onChangePerPage={onResultsPerPageChange}
            currentPage={pageNumber}
            perPage={resultsPerPage}
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
    startDate: undefined,
    endDate: undefined,
  },
  description: '',
  modalities: [],
  accession: '',
  sortBy: '',
  sortDirection: 'none',
  pageNumber: 1,
  resultsPerPage: 25,
};

function _getQueryFilterValues(query) {
  const queryFilterValues = {
    patientName: query.get('patientName'),
    mrn: query.get('mrn'),
    studyDate: {
      startDate: query.get('startDate'),
      endDate: query.get('endDate'),
    },
    description: query.get('description'),
    modalities: query.get('modalities')
      ? query.get('modalities').split(',')
      : [],
    accession: query.get('accession'),
    sortBy: query.get('sortBy'),
    sortDirection: query.get('sortDirection'),
    pageNumber: _tryParseInt(query.get('pageNumber'), undefined),
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
}

export default StudyListContainer;

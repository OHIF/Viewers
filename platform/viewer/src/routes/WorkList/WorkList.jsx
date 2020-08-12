import React, { useState, useEffect } from 'react';
import classnames from 'classnames';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import moment from 'moment';
import qs from 'query-string';
import isEqual from 'lodash.isequal';
//
import filtersMeta from './filtersMeta.js';
import { useAppConfig } from '@state';
import { useDebounce, useQuery } from '@hooks';

import PreferencesDropdown from '../../components/PreferencesDropdown';

import {
  Icon,
  StudyListExpandedRow,
  Button,
  NavBar,
  Svg,
  EmptyStudies,
  StudyListTable,
  StudyListPagination,
  StudyListFilter,
  TooltipClipboard,
} from '@ohif/ui';

const seriesInStudiesMap = new Map();

/**
 * TODO:
 * - debounce `setFilterValues` (150ms?)
 */
function WorkList({ history, data: studies, isLoadingData, dataSource, hotkeysManager }) {
  // ~ Modes
  const [appConfig] = useAppConfig();
  // ~ Filters
  const query = useQuery();
  const queryFilterValues = _getQueryFilterValues(query);
  const [filterValues, _setFilterValues] = useState({
    ...defaultFilterValues,
    ...queryFilterValues,
  });

  const debouncedFilterValues = useDebounce(filterValues, 200);
  const { resultsPerPage, pageNumber, sortBy, sortDirection } = filterValues;

  const sortedStudies = studies
    // TOOD: Move sort to DataSourceWrapper?
    // TODO: MOTIVATION, this is triggered on every render, even if list/sort does not change
    .sort((s1, s2) => {
      const noSortApplied = sortBy === '' || !sortBy;
      const sortModifier = sortDirection === 'descending' ? 1 : -1;

      if (noSortApplied && studies.length < 101) {
        const ascendingSortModifier = -1;

        return _sortStringDates(s1, s2, ascendingSortModifier);
      } else if (noSortApplied) {
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
        return _sortStringDates(s1, s2, sortModifier);
      }

      return 0;
    });

  // ~ Rows & Studies
  const [expandedRows, setExpandedRows] = useState([]);
  const [studiesWithSeriesData, setStudiesWithSeriesData] = useState([]);
  const numOfStudies = studies.length;
  const totalPages = Math.floor(numOfStudies / resultsPerPage) + 1;

  const setFilterValues = val => {
    if (filterValues.pageNumber === val.pageNumber) {
      val.pageNumber = 1;
    }
    _setFilterValues(val);
    setExpandedRows([]);
  };

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

  // Sync URL query parameters with filters
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

  // Query for series information
  useEffect(() => {
    const fetchSeries = async studyInstanceUid => {
      try {
        const result = await dataSource.query.series.search(studyInstanceUid);

        seriesInStudiesMap.set(studyInstanceUid, result);
        setStudiesWithSeriesData([...studiesWithSeriesData, studyInstanceUid]);
      } catch (ex) {
        // TODO: UI Notification Service
        console.warn(ex);
      }
    };

    // TODO: WHY WOULD YOU USE AN INDEX OF 1?!
    // Note: expanded rows index begins at 1
    for (let z = 0; z < expandedRows.length; z++) {
      const expandedRowIndex = expandedRows[z] - 1;
      const studyInstanceUid = sortedStudies[expandedRowIndex].studyInstanceUid;

      if (studiesWithSeriesData.includes(studyInstanceUid)) {
        continue;
      }

      fetchSeries(studyInstanceUid);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expandedRows, studies]);

  const isFiltering = (filterValues, defaultFilterValues) => {
    return !isEqual(filterValues, defaultFilterValues);
  };

  const tableDataSource = sortedStudies.map((study, key) => {
    const rowKey = key + 1;
    const isExpanded = expandedRows.some(k => k === rowKey);
    const {
      studyInstanceUid,
      accession,
      modalities,
      instances,
      description,
      mrn,
      patientName,
      date,
      time,
    } = study;
    const studyDate =
      date &&
      moment(date, ['YYYYMMDD', 'YYYY.MM.DD'], true).isValid() &&
      moment(date, ['YYYYMMDD', 'YYYY.MM.DD']).format('MMM-DD-YYYY');
    const studyTime =
      time &&
      moment(time, ['HH', 'HHmm', 'HHmmss', 'HHmmss.SSS']).isValid() &&
      moment(time, ['HH', 'HHmm', 'HHmmss', 'HHmmss.SSS']).format('hh:mm A');

    return {
      row: [
        {
          key: 'patientName',
          content: patientName ? (
            <TooltipClipboard>{patientName}</TooltipClipboard>
          ) : (
              <span className="text-gray-700">(Empty)</span>
            ),
          gridCol: 4,
        },
        {
          key: 'mrn',
          content: <TooltipClipboard>{mrn}</TooltipClipboard>,
          gridCol: 3,
        },
        {
          key: 'studyDate',
          content: (
            <div>
              {studyDate && <span className="mr-4">{studyDate}</span>}
              {studyTime && <span>{studyTime}</span>}
            </div>
          ),
          title: `${studyDate || ''} ${studyTime || ''}`,
          gridCol: 5,
        },
        {
          key: 'description',
          content: <TooltipClipboard>{description}</TooltipClipboard>,
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
          content: <TooltipClipboard>{accession}</TooltipClipboard>,
          gridCol: 3,
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
          seriesTableColumns={{
            description: 'Description',
            seriesNumber: 'Series',
            modality: 'Modality',
            instances: 'Instances',
          }}
          seriesTableDataSource={
            seriesInStudiesMap.has(studyInstanceUid)
              ? seriesInStudiesMap.get(studyInstanceUid).map(s => {
                return {
                  description: s.description || '(empty)',
                  seriesNumber: s.seriesNumber || '',
                  modality: s.modality || '',
                  instances: s.numSeriesInstances || '',
                };
              })
              : []
          }
        >
          {appConfig.modes.map((mode, i) => {
            const isFirst = i === 0;

            // TODO: Homes need a default/target route? We mostly support a single one for now.
            // We should also be using the route path, but currently are not
            // mode.id
            // mode.routes[x].path
            // Don't specify default data source, and it should just be picked up... (this may not currently be the case)
            // How do we know which params to pass? Today, it's just StudyInstanceUIDs
            return (
              <Link
                key={i}
                to={`${mode.id}?StudyInstanceUIDs=${studyInstanceUid}`}
              // to={`${mode.id}/dicomweb?StudyInstanceUIDs=${studyInstanceUid}`}
              >
                <Button
                  rounded="full"
                  variant="contained" // outlined
                  disabled={false}
                  endIcon={<Icon name="launch-arrow" />} // launch-arrow | launch-info
                  className={classnames('font-bold', { 'ml-2': !isFirst })}
                  onClick={() => { }}
                >
                  {mode.displayName}
                </Button>
              </Link>
            );
          })}
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
          <span className="mr-3 text-lg text-common-light">
            FOR INVESTIGATIONAL USE ONLY
          </span>
          <PreferencesDropdown hotkeysManager={hotkeysManager} />
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
            <EmptyStudies isLoading={isLoadingData} />
          </div>
        )}
    </div>
  );
}

WorkList.propTypes = {
  history: PropTypes.shape({
    push: PropTypes.func,
  }).isRequired,
  data: PropTypes.array.isRequired,
  dataSource: PropTypes.shape({
    query: PropTypes.object.isRequired,
  }).isRequired,
  isLoadingData: PropTypes.bool.isRequired,
};

const defaultFilterValues = {
  patientName: '',
  mrn: '',
  studyDate: {
    startDate: null,
    endDate: null,
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

function _sortStringDates(s1, s2, sortModifier) {
  // TODO: Delimiters are non-standard. Should we support them?
  const s1Date = moment(s1.date, ['YYYYMMDD', 'YYYY.MM.DD'], true);
  const s2Date = moment(s2.date, ['YYYYMMDD', 'YYYY.MM.DD'], true);

  if (s1Date.isValid() && s2Date.isValid()) {
    return (
      (s1Date.toISOString() > s2Date.toISOString() ? 1 : -1) * sortModifier
    );
  } else if (s1Date.isValid()) {
    return sortModifier;
  } else if (s2Date.isValid()) {
    return -1 * sortModifier;
  }
}

export default WorkList;

import React, { useState, useEffect, useContext } from 'react';
import PropTypes from 'prop-types';
import Dropzone from 'react-dropzone';
import OHIF from '@ohif/core';
import { withRouter } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  StudyList,
  PageToolbar,
  TablePagination,
  useDebounce,
  useMedia,
} from '@ohif/ui';
import ConnectedHeader from '../connectedComponents/ConnectedHeader.js';
import * as RoutesUtil from '../routes/routesUtil';
import moment from 'moment';
import ConnectedDicomFilesUploader from '../googleCloud/ConnectedDicomFilesUploader';
import ConnectedDicomStorePicker from '../googleCloud/ConnectedDicomStorePicker';
import filesToStudies from '../lib/filesToStudies.js';

// Contexts
import UserManagerContext from '../context/UserManagerContext';
import WhiteLabellingContext from '../context/WhiteLabellingContext';
import AppContext from '../context/AppContext';

const { urlUtil: UrlUtil } = OHIF.utils;

function StudyListRoute(props) {
  const { history, server, user, studyListFunctionsEnabled } = props;
  const [t] = useTranslation('Common');
  // ~~ STATE
  const [sort, setSort] = useState({
    fieldName: 'patientName',
    direction: 'desc',
  });
  const [filterValues, setFilterValues] = useState({
    studyDateTo: null,
    studyDateFrom: null,
    patientName: '',
    patientId: '',
    accessionNumber: '',
    studyDate: '',
    modalities: '',
    studyDescription: '',
    //
    patientNameOrId: '',
    accessionOrModalityOrDescription: '',
    //
    allFields: '',
  });
  const [studies, setStudies] = useState([]);
  const [searchStatus, setSearchStatus] = useState({
    isSearchingForStudies: false,
    error: null,
  });
  const [activeModalId, setActiveModalId] = useState(null);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [pageNumber, setPageNumber] = useState(0);
  const appContext = useContext(AppContext);
  // ~~ RESPONSIVE
  const displaySize = useMedia(
    ['(min-width: 1750px)', '(min-width: 1000px)', '(min-width: 768px)'],
    ['large', 'medium', 'small'],
    'small'
  );
  // ~~ DEBOUNCED INPUT
  const debouncedSort = useDebounce(sort, 200);
  const debouncedFilters = useDebounce(filterValues, 250);

  // Google Cloud Adapter for DICOM Store Picking
  const { appConfig = {} } = appContext;
  const isGoogleCHAIntegrationEnabled =
    !server && appConfig.enableGoogleCloudAdapter;
  if (isGoogleCHAIntegrationEnabled && activeModalId !== 'DicomStorePicker') {
    setActiveModalId('DicomStorePicker');
  }

  // Called when relevant state/props are updated
  // Watches filters and sort, debounced
  useEffect(
    () => {
      const fetchStudies = async () => {
        try {
          setSearchStatus({ error: null, isSearchingForStudies: true });

          const response = await getStudyList(
            server,
            debouncedFilters,
            debouncedSort,
            rowsPerPage,
            pageNumber,
            displaySize
          );

          setStudies(response);
          setSearchStatus({ error: null, isSearchingForStudies: false });
        } catch (error) {
          console.warn(error);
          setSearchStatus({ error: true, isFetching: false });
        }
      };

      if (server) {
        fetchStudies();
      }
    },
    // TODO: Can we update studies directly?
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      debouncedFilters,
      debouncedSort,
      rowsPerPage,
      pageNumber,
      displaySize,
      server,
    ]
  );

  // TODO: Update Server
  // if (this.props.server !== prevProps.server) {
  //   this.setState({
  //     modalComponentId: null,
  //     searchData: null,
  //     studies: null,
  //   });
  // }

  const onDrop = async acceptedFiles => {
    try {
      const studiesFromFiles = await filesToStudies(acceptedFiles);
      setStudies(studiesFromFiles);
    } catch (error) {
      setSearchStatus({ isSearchingForStudies: false, error });
    }
  };

  if (searchStatus.error) {
    return <div>Error: {JSON.stringify(searchStatus.error)}</div>;
  } else if (studies === [] && !activeModalId) {
    return <div>Loading...</div>;
  }

  let healthCareApiButtons = null;
  let healthCareApiWindows = null;

  if (appConfig.enableGoogleCloudAdapter) {
    const isModalOpen = activeModalId === 'DicomStorePicker';
    updateURL(isModalOpen, appConfig, server, history);

    healthCareApiWindows = (
      <ConnectedDicomStorePicker
        isOpen={activeModalId === 'DicomStorePicker'}
        onClose={() => setActiveModalId(null)}
      />
    );

    healthCareApiButtons = (
      <div
        className="form-inline btn-group pull-right"
        style={{ padding: '20px' }}
      >
        <button
          className="btn btn-primary"
          onClick={() => setActiveModalId('DicomStorePicker')}
        >
          {t('Change DICOM Store')}
        </button>
      </div>
    );
  }

  function handleSort(fieldName) {
    let sortFieldName = fieldName;
    let sortDirection = 'asc';

    if (fieldName === sort.fieldName) {
      if (sort.direction === 'asc') {
        sortDirection = 'desc';
      } else {
        sortFieldName = null;
        sortDirection = null;
      }
    }

    setSort({
      fieldName: sortFieldName,
      direction: sortDirection,
    });
  }

  function handleFilterChange(fieldName, value) {
    const updatedFilterValues = Object.assign({}, filterValues);

    updatedFilterValues[fieldName] = value;
    setFilterValues(updatedFilterValues);
  }

  return (
    <>
      {studyListFunctionsEnabled ? (
        <ConnectedDicomFilesUploader
          isOpen={activeModalId === 'DicomFilesUploader'}
          onClose={() => setActiveModalId(null)}
        />
      ) : null}
      {healthCareApiWindows}
      <WhiteLabellingContext.Consumer>
        {whiteLabelling => (
          <UserManagerContext.Consumer>
            {userManager => (
              <ConnectedHeader
                home={true}
                user={user}
                userManager={userManager}
              >
                {whiteLabelling.logoComponent}
              </ConnectedHeader>
            )}
          </UserManagerContext.Consumer>
        )}
      </WhiteLabellingContext.Consumer>
      <div className="study-list-header">
        <div className="header">
          <h1 style={{ fontWeight: 300, fontSize: '22px' }}>
            {t('StudyList')}
          </h1>
        </div>
        <div className="actions">
          {studyListFunctionsEnabled && healthCareApiButtons}
          {studyListFunctionsEnabled && (
            <PageToolbar
              onImport={() => setActiveModalId('DicomFilesUploader')}
            />
          )}
          <span className="study-count">{studies.length}</span>
        </div>
      </div>

      <div className="table-head-background" />
      <div className="study-list-container">
        {/* STUDY LIST OR DROP ZONE? */}
        <StudyList
          isLoading={searchStatus.isSearchingForStudies}
          hasError={searchStatus.error === true}
          // Rows
          studies={studies}
          onSelectItem={studyInstanceUID => {
            const viewerPath = RoutesUtil.parseViewerPath(appConfig, server, {
              studyInstanceUids: studyInstanceUID,
            });
            history.push(viewerPath);
          }}
          // Table Header
          sort={sort}
          onSort={handleSort}
          filterValues={filterValues}
          onFilterChange={handleFilterChange}
          studyListDateFilterNumDays={appConfig.studyListDateFilterNumDays}
        />
        {/* PAGINATION FOOTER */}
        <TablePagination
          currentPage={pageNumber}
          nextPageFunc={() => setPageNumber(pageNumber + 1)}
          prevPageFunc={() => setPageNumber(pageNumber - 1)}
          onRowsPerPageChange={rows => setRowsPerPage(rows)}
          rowsPerPage={rowsPerPage}
          recordCount={studies.length}
        />
      </div>
    </>
  );
}

StudyListRoute.propTypes = {
  filters: PropTypes.object,
  patientId: PropTypes.string,
  server: PropTypes.object,
  user: PropTypes.object,
  history: PropTypes.object,
  studyListFunctionsEnabled: PropTypes.bool,
};

StudyListRoute.defaultProps = {
  studyListFunctionsEnabled: true,
};

function updateURL(isModalOpen, appConfig, server, history) {
  if (isModalOpen) {
    return;
  }

  const listPath = RoutesUtil.parseStudyListPath(appConfig, server);

  if (UrlUtil.paramString.isValidPath(listPath)) {
    const { location = {} } = history;
    if (location.pathname !== listPath) {
      history.replace(listPath);
    }
  }
}

/**
 * Not ideal, but we use displaySize to determine how the filters should be used
 * to build the collection of promises we need to fetch a result set.
 *
 * @param {*} server
 * @param {*} filters
 * @param {object} sort
 * @param {string} sort.fieldName - field to sort by
 * @param {string} sort.direction - direction to sort
 * @param {number} rowsPerPage - Number of results to return
 * @param {number} pageNumber - Used to determine results offset
 * @param {string} displaySize - small, medium, large
 * @returns
 */
async function getStudyList(
  server,
  filters,
  sort,
  rowsPerPage,
  pageNumber,
  displaySize
) {
  const {
    allFields,
    patientNameOrId,
    accessionOrModalityOrDescription,
  } = filters;
  const sortFieldName = sort.fieldName || 'patientName';
  const sortDirection = sort.direction || 'desc';
  const studyDateFrom =
    filters.studyDateFrom ||
    moment()
      .subtract(25000, 'days')
      .toDate();
  const studyDateTo = filters.studyDateTo || new Date();

  const mappedFilters = {
    patientId: filters.patientId,
    patientName: filters.patientName,
    accessionNumber: filters.accessionNumber,
    studyDescription: filters.studyDescription,
    modalitiesInStudy: filters.modalities,
    // NEVER CHANGE
    studyDateFrom,
    studyDateTo,
    limit: rowsPerPage,
    offset: pageNumber * rowsPerPage,
    fuzzymatching: server.supportsFuzzyMatching === true,
  };

  const studies = await _fetchStudies(server, mappedFilters, displaySize, {
    allFields,
    patientNameOrId,
    accessionOrModalityOrDescription,
  });

  // Only the fields we use
  const mappedStudies = studies.map(study => {
    const patientName =
      typeof study.patientName === 'string' ? study.patientName : undefined;

    return {
      accessionNumber: study.accessionNumber, // "1"
      modalities: study.modalities, // "SEG\\MR"  ​​
      // numberOfStudyRelatedInstances: "3"
      // numberOfStudyRelatedSeries: "3"
      // patientBirthdate: undefined
      patientId: study.patientId, // "NOID"
      patientName, // "NAME^NONE"
      // patientSex: "M"
      // referringPhysicianName: undefined
      studyDate: study.studyDate, // "Jun 28, 2002"
      studyDescription: study.studyDescription, // "BRAIN"
      // studyId: "No Study ID"
      studyInstanceUid: study.studyInstanceUid, // "1.3.6.1.4.1.5962.99.1.3814087073.479799962.1489872804257.3.0"
      // studyTime: "160956.0"
    };
  });

  // For our smaller displays, map our field name to a single
  // field we can actually sort by.
  const sortFieldNameMapping = {
    allFields: 'patientName',
    patientNameOrId: 'patientName',
    accessionOrModalityOrDescription: 'modalities',
  };
  const mappedSortFieldName =
    sortFieldNameMapping[sortFieldName] || sortFieldName;

  const sortedStudies = _sortStudies(
    mappedStudies,
    mappedSortFieldName,
    sortDirection
  );

  // Because we've merged multiple requests, we may have more than
  // our rows per page. Let's `take` that number from our sorted array.
  // This "might" cause paging issues.
  const numToTake =
    sortedStudies.length < rowsPerPage ? sortedStudies.length : rowsPerPage;
  const result = sortedStudies.slice(0, numToTake);

  return result;
}

/**
 *
 *
 * @param {object[]} studies - Array of studies to sort
 * @param {string} studies.studyDate - Date in 'MMM DD, YYYY' format
 * @param {string} field - name of properties on study to sort by
 * @param {string} order - 'asc' or 'desc'
 * @returns
 */
function _sortStudies(studies, field, order) {
  // Make sure our studyDate is in a valid format and create copy of studies array
  const sortedStudies = studies.map(study => {
    if (!moment(study.studyDate, 'MMM DD, YYYY', true).isValid()) {
      study.studyDate = moment(study.studyDate, 'YYYYMMDD').format(
        'MMM DD, YYYY'
      );
    }
    return study;
  });

  // Sort by field
  sortedStudies.sort(function(a, b) {
    let fieldA = a[field];
    let fieldB = b[field];
    if (field === 'studyDate') {
      fieldA = moment(fieldA).toISOString();
      fieldB = moment(fieldB).toISOString();
    }

    // Order
    if (order === 'desc') {
      if (fieldA < fieldB) {
        return -1;
      }
      if (fieldA > fieldB) {
        return 1;
      }
      return 0;
    } else {
      if (fieldA > fieldB) {
        return -1;
      }
      if (fieldA < fieldB) {
        return 1;
      }
      return 0;
    }
  });

  return sortedStudies;
}

/**
 * We're forced to do this because DICOMWeb does not support "AND|OR" searches
 * across multiple fields. This allows us to make multiple requests, remove
 * duplicates, and return the result set as if it were supported
 *
 * @param {object} server
 * @param {Object} filters
 * @param {string} displaySize - small, medium, or large
 * @param {string} multi.allFields
 * @param {string} multi.patientNameOrId
 * @param {string} multi.accessionOrModalityOrDescription
 */
async function _fetchStudies(
  server,
  filters,
  displaySize,
  { allFields, patientNameOrId, accessionOrModalityOrDescription }
) {
  let queryFiltersArray = [filters];

  if (displaySize === 'small') {
    const firstSet = _getQueryFiltersForValue(
      filters,
      [
        'patientId',
        'patientName',
        'accessionNumber',
        'studyDescription',
        'modalitiesInStudy',
      ],
      allFields
    );

    if (firstSet.length) {
      queryFiltersArray = firstSet;
    }
  } else if (displaySize === 'medium') {
    const firstSet = _getQueryFiltersForValue(
      filters,
      ['patientId', 'patientName'],
      patientNameOrId
    );

    const secondSet = _getQueryFiltersForValue(
      filters,
      ['accessionNumber', 'studyDescription', 'modalitiesInStudy'],
      accessionOrModalityOrDescription
    );

    if (firstSet.length || secondSet.length) {
      queryFiltersArray = firstSet.concat(secondSet);
    }
  }

  const queryPromises = [];

  queryFiltersArray.forEach(filter => {
    const searchStudiesPromise = OHIF.studies.searchStudies(server, filter);
    queryPromises.push(searchStudiesPromise);
  });

  const lotsOfStudies = await Promise.all(queryPromises);
  const studies = [];

  // Flatten and dedupe
  lotsOfStudies.forEach(arrayOfStudies => {
    if (arrayOfStudies) {
      arrayOfStudies.forEach(study => {
        if (!studies.some(s => s.studyInstanceUid === study.studyInstanceUid)) {
          studies.push(study);
        }
      });
    }
  });

  return studies;
}

/**
 *
 *
 * @param {*} filters
 * @param {*} fields - Array of string fields
 * @param {*} value
 */
function _getQueryFiltersForValue(filters, fields, value) {
  const queryFilters = [];

  if (value === '' || !value) {
    return queryFilters;
  }

  fields.forEach(field => {
    const filter = Object.assign(
      {
        patientId: '',
        patientName: '',
        accessionNumber: '',
        studyDescription: '',
        modalitiesInStudy: '',
      },
      filters
    );

    filter[field] = value;
    queryFilters.push(filter);
  });

  return queryFilters;
}

export default withRouter(StudyListRoute);

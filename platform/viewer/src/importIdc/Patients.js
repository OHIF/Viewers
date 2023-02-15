import React, { useState, useEffect, useContext } from 'react';
import PropTypes, { func } from 'prop-types';
import OHIF from '@ohif/core';
import { useTranslation } from 'react-i18next';
import { TablePagination, useMedia, Icon } from '@ohif/ui';

// Contexts
import { PatientList } from './PatientList';
import { applyPagination, _sortCollections } from './utils';
import { radcadapi } from '../utils/constants';

function applySort(sort, data) {
  const sortFieldName = sort.fieldName || 'PatientID';
  const sortDirection = sort.direction || 'desc';

  const sortFieldNameMapping = {
    allFields: 'PatientID',
  };
  const mappedSortFieldName =
    sortFieldNameMapping[sortFieldName] || sortFieldName;
  return _sortCollections(data, mappedSortFieldName, sortDirection);
}

function applyFilters(data, filters) {
  const properties = [];
  const fields = ['PatientID', 'Modalities', 'BodyPart'];
  fields.forEach(field => {
    if (filters[field]) properties.push(field);
  });

  return data.filter(item => {
    if (properties.length > 0) {
      let queryMatched = false;
      properties.forEach(property => {
        if (
          item[property].toLowerCase().includes(filters[property].toLowerCase())
        ) {
          queryMatched = true;
        }
      });

      if (!queryMatched) {
        return false;
      }
    }
    return true;
  });
}

function ConfirmDialog(props) {
  const { setOpenDialog, onComplete, StudyUID } = props;
  const { t } = useTranslation('Common');

  const [searchStatus, setSearchStatus] = useState({
    isFetching: false,
    error: null,
  });

  const handleConfirm = async () => {
    try {
      setSearchStatus({ error: null, isFetching: true });

      var requestOptions = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ study_uid: StudyUID }),
      };

      const response = await fetch(`${radcadapi}/import-idc-study`, requestOptions);

      setSearchStatus({ error: null, isFetching: false });
      onComplete();
    } catch (error) {
      // setSearchStatus({
      //   isFetching: false,
      //   error: 'Endpoint request timed out',
      // });]
      // ignore error message for now
      setSearchStatus({ error: null, isFetching: false });
      onComplete();
    }
  };

  let content = (
    <h4>
      Are you sure you want to import this IDC? This will import the selected
      IDC into the viewer.
    </h4>
  );

  if (searchStatus.error) {
    content = (
      <div>
        <div>Error: {JSON.stringify(searchStatus.error)}</div>
      </div>
    );
  } else if (searchStatus.isFetching) {
    content = (
      <Icon name="circle-notch" className="loading-icon-spin loading-icon" />
    );
  }

  const onClose = event => {
    event.preventDefault();
    event.stopPropagation();
    setOpenDialog(false);
  };

  const onConfirm = event => {
    event.preventDefault();
    event.stopPropagation();
    handleConfirm();
  };

  return (
    <React.Fragment>
      <div className={`simpleDialog confirm-dialog  `}>
        <form>
          <div className="header">
            <span className="closeBtn" onClick={onClose}>
              <span className="closeIcon">x</span>
            </span>
            <h4 className="title">Confirm Import Idc</h4>
          </div>
          <div className="content">{content}</div>
          <div className="footer">
            <button
              // disabled={searchStatus.isFetching}
              className="btn btn-danger"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              disabled={searchStatus.isFetching}
              className="btn btn-primary"
              onClick={onConfirm}
            >
              Confirm
            </button>
          </div>
        </form>
      </div>
    </React.Fragment>
  );
}

function PatientsPage(props) {
  const { collection_api_id, handleOnSuccess } = props;
  const [t] = useTranslation('Common');
  // ~~ STATE

  const [searchStatus, setSearchStatus] = useState({
    isFetching: false,
    error: null,
  });

  const [sort, setSort] = useState({
    fieldName: 'PatientID',
    direction: 'desc',
  });
  const [filterValues, setFilterValues] = useState({
    PatientID: '',
    Modalities: '',
    BodyPart: '',
    allFields: '',
  });

  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [pageNumber, setPageNumber] = useState(0);
  const [openDialog, setOpenDialog] = useState(false);
  const [patients, setPatients] = useState([]);
  const [studyUID, setStudyUID] = useState(null);

  const displaySize = useMedia(
    [
      '(min-width: 1750px)',
      '(min-width: 1000px) and (max-width: 1749px)',
      '(max-width: 999px)',
    ],
    ['large', 'medium', 'small'],
    'small'
  );

  useEffect(() => {
    const fetchpatients = async () => {
      try {
        setSearchStatus({ error: null, isFetching: true });

        var requestOptions = {
          method: 'GET',
        };

        const response = await fetch(
          `${radcadapi}/tcia-collection-studies?collection=${collection_api_id}`,
          requestOptions
        );
        let result = await response.json();
        // Only the fields we use
        result = result.map(patients => {
          return {
            PatientID: patients.PatientID, // "SEG\\MR"  ​​
            StudyUID: patients.StudyUID, // "NOID"
            Modalities: patients.Modalities, // "NOID"
            BodyPart: patients.BodyPart, // "NOID"
            ViewUrl: patients.view_url, // "NOID"
          };
        });

        setPatients(result);
        setSearchStatus({ error: null, isFetching: false });
      } catch (error) {
        console.warn(error);
        setSearchStatus({ error: true, isFetching: false });
      }
    };

    fetchpatients();
  }, [collection_api_id]);

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
    setFilterValues(state => {
      return {
        ...state,
        [fieldName]: value,
      };
    });
  }

  function handleOncomplete() {
    setOpenDialog(false);
    handleOnSuccess();
  }

  function handleOnSelect(StudyUID) {
    setStudyUID(StudyUID);

    const series_uid = JSON.parse(localStorage.getItem('series_uid'));

    setOpenDialog(true);
  }

  const filteredPatients = applyFilters(patients, filterValues);
  const sortedPatients = applySort(sort, filteredPatients);

  const paginatedPatients = applyPagination(
    sortedPatients,
    pageNumber,
    rowsPerPage
  );

  return (
    <>
      {openDialog && studyUID && (
        <ConfirmDialog
          setOpenDialog={setOpenDialog}
          onComplete={handleOncomplete}
          StudyUID={studyUID}
        />
      )}

      <div className="import-list-container">
        <PatientList
          isLoading={searchStatus.isFetching}
          hasError={searchStatus.error === true}
          // Rows
          patients={paginatedPatients}
          onSelectItem={handleOnSelect}
          // Table Header
          sort={sort}
          onSort={handleSort}
          filterValues={filterValues}
          onFilterChange={handleFilterChange}
          displaySize={displaySize}
        />

        <TablePagination
          currentPage={pageNumber}
          nextPageFunc={() => setPageNumber(pageNumber + 1)}
          prevPageFunc={() => setPageNumber(pageNumber - 1)}
          onRowsPerPageChange={Rows => setRowsPerPage(Rows)}
          rowsPerPage={rowsPerPage}
          recordCount={patients.length}
        />
      </div>
    </>
  );
}

PatientsPage.propTypes = {
  collection_api_id: PropTypes.string.isRequired,
  handleOnSuccess: PropTypes.func,
};

export default PatientsPage;

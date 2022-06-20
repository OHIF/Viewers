import React, { useState, useEffect, useContext } from 'react';
import PropTypes from 'prop-types';
import OHIF from '@ohif/core';
import { useTranslation } from 'react-i18next';
import { TablePagination, useMedia, Icon } from '@ohif/ui';
import { connect } from 'react-redux';

// Contexts
import { CollectionList } from './CollectionList';
import { setCollections } from '../../../core/src/redux/actions';
import { applyPagination, _sortCollections } from './utils';

function applySort(sort, collections = []) {
  const sortFieldName = sort.fieldName || 'CollectionID';
  const sortDirection = sort.direction || 'desc';

  const sortFieldNameMapping = {
    allFields: 'CollectionID',
  };
  const mappedSortFieldName =
    sortFieldNameMapping[sortFieldName] || sortFieldName;
  return _sortCollections(collections, mappedSortFieldName, sortDirection);
}

function applyFilters(collections = [], filters = {}) {
  const properties = [];
  const fields = ['CancerType', 'CollectionID'];
  fields.forEach(field => {
    if (filters[field]) properties.push(field);
  });

  return collections.filter(collection => {
    if (properties.length > 0) {
      let queryMatched = false;
      properties.forEach(property => {
        if (
          collection[property]
            .toLowerCase()
            .includes(filters[property].toLowerCase())
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

function Collections(props) {
  const { onSelected, collections, setCollections } = props;
  const [t] = useTranslation('Common');
  // ~~ STATE

  const [searchStatus, setSearchStatus] = useState({
    isFetching: false,
    error: null,
  });

  const [sort, setSort] = useState({
    fieldName: 'CollectionID',
    direction: 'desc',
  });
  const [filterValues, setFilterValues] = useState({
    CancerType: '',
    CollectionID: '',
    allFields: '',
  });

  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [pageNumber, setPageNumber] = useState(0);

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
    const fetchCollections = async () => {
      try {
        if (collections.length > 0) return;

        setSearchStatus({ error: null, isFetching: true });

        var requestOptions = {
          method: 'GET',
        };

        const response = await fetch(
          `https://radcadapi.thetatech.ai/tcia-collections`,
          requestOptions
        );
        let result = await response.json();

        // Only the fields we use
        result = result.map(collection => {
          return {
            CancerType: collection.cancer_type, // "1"
            CollectionID: collection.collection_id, // "SEG\\MR"  ​​
            ApiId: collection.api_id, // "SEG\\MR"  ​​
            Species: collection.species, // "NOID"
            Doi: collection.doi, // "NOID"
            Location: collection.location, // "NOID"
            SubjectCount: collection.subject_ount, // "NOID"
            UpdatedDate: collection.date_updated, // "Jun 28, 2002"
            Description: collection.description, // "BRAIN"
            SupportingData: collection.supporting_data, // "BRAIN"
          };
        });

        setCollections(result);
        setSearchStatus({ error: null, isFetching: false });
      } catch (error) {
        console.warn(error);
        setSearchStatus({ error: true, isFetching: false });
      }
    };

    fetchCollections();
  }, []);

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
  function handleOnSelect(CollectionID) {
    onSelected(CollectionID);
  }

  const filteredCollections = applyFilters(collections, filterValues);
  const sortedCollections = applySort(sort, filteredCollections);

  const paginatedCollections = applyPagination(
    sortedCollections,
    pageNumber,
    rowsPerPage
  );

  return (
    <>
      <div className="import-list-container">
        <CollectionList
          isLoading={searchStatus.isFetching}
          hasError={searchStatus.error === true}
          // Rows
          collections={paginatedCollections}
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
          recordCount={collections.length}
        />
      </div>
    </>
  );
}

Collections.propTypes = {
  onSelected: PropTypes.func,
  collections: PropTypes.array,
  setCollections: PropTypes.func,
};

Collections.defaultProps = {
  collections: [],
};

const mapStateToProps = state => {
  const { collections, isFetching, error } = state.collections;
  return {
    collections,
    isFetching,
    error,
  };
};

const mapDispatchToProps = dispatch => {
  return {
    // set collections data
    setCollections: collections => {
      dispatch(setCollections(collections));
    },
  };
};

const ConnectedCollections = connect(
  mapStateToProps,
  mapDispatchToProps
)(Collections);

export default ConnectedCollections;

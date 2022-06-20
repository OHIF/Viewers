import React from 'react';
import moment from 'moment';

export const applyPagination = (data = [], page, rowsPerPage) =>
  data.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

export const _sortCollections = (data = [], field, order) => {
  // Make sure our StudyDate is in a valid format and create copy of studies array
  const sortedData = data.map(item => {
    if (!moment(item.UpdatedDate, 'MMM DD, YYYY', true).isValid()) {
      item.UpdatedDate = moment(item.UpdatedDate, 'YYYYMMDD').format(
        'MMM DD, YYYY'
      );
    }
    return item;
  });

  // Sort by field
  sortedData.sort(function(a, b) {
    let fieldA = a[field];
    let fieldB = b[field];
    if (field === 'UpdatedDate') {
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

  return sortedData;
};

import React, { useState } from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';
import { Icon } from '../../elements/Icon';
import { useTranslation } from 'react-i18next';

function TableLabel(props) {
  const {
    meta,
    values,
    onSort,
    onValueChange,
    sortFieldName,
    sortDirection,
    // TODO: Rename
    studyListDateFilterNumDays,
  } = props;

  const { t, ready: translationsAreReady } = useTranslation('Common');

  const sortIcons = ['sort', 'sort-up', 'sort-down'];
  const sortIconForSortField =
    sortDirection === 'asc' ? sortIcons[1] : sortIcons[2];

  return translationsAreReady
    ? meta.map((field, i) => {
        const { displayText, fieldName, inputType } = field;
        const isSortField = sortFieldName === fieldName;
        const sortIcon = isSortField ? sortIconForSortField : sortIcons[0];

        return (
          <div
            style={{
              flex: 1,
            }}
            key={`${fieldName}-${i}`}
          >
            <label
              htmlFor={`filter-${fieldName}`}
              onClick={() => onSort(fieldName)}
            >
              {`${displayText}`}
              <Icon name={sortIcon} style={{ fontSize: '12px' }} />
            </label>
          </div>
        );
      })
    : null;
}

TableLabel.propTypes = {
  meta: PropTypes.arrayOf(
    PropTypes.shape({
      displayText: PropTypes.string.isRequired,
      fieldName: PropTypes.string.isRequired,
      inputType: PropTypes.oneOf(['text', 'date-range']).isRequired,
      size: PropTypes.number.isRequired,
    })
  ).isRequired,
  values: PropTypes.object.isRequired,
  onSort: PropTypes.func.isRequired,
  sortFieldName: PropTypes.string,
  sortDirection: PropTypes.oneOf([null, 'asc', 'desc']),
};

TableLabel.defaultProps = {};

export { TableLabel };
export default TableLabel;

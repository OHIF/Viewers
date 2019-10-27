import React, { useState } from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';
import { isInclusivelyBeforeDay } from 'react-dates';
import CustomDateRangePicker from './CustomDateRangePicker.js';
import { Icon } from './../../elements/Icon';
import { useTranslation } from 'react-i18next';



function TableSearchFilter(props) {
  const {
    meta,
    values,
    onSort,
    onValueChange,
    sortFieldName,
    sortDirection,
    // TODO: Rename
    studyListDateFilterNumDays
  } = props;
  const [focusedInput, setFocusedInput] = useState(null);
  const [t] = useTranslation(); // 'Common'?

  const sortIcons = ['sort', 'sort-up', 'sort-down'];
  const sortIconForSortField =
    sortDirection === 'asc' ? sortIcons[1] : sortIcons[2];
  //
  const today = moment();
  const lastWeek = moment().subtract(7, 'day');
  const lastMonth = moment().subtract(1, 'month');
  const defaultStartDate = moment().subtract(studyListDateFilterNumDays, 'days');
  const defaultEndDate = today;
  const studyDatePresets = [
    {
      text: t('Today'),
      start: today,
      end: today,
    },
    {
      text: t('Last 7 days'),
      start: lastWeek,
      end: today,
    },
    {
      text: t('Last 30 days'),
      start: lastMonth,
      end: today,
    },
  ];

  return meta.map((field, i) => {
    const { displayText, fieldName, inputType } = field;
    const isSortField = sortFieldName === fieldName;
    const sortIcon = isSortField ? sortIconForSortField : sortIcons[0];

    return (
      <th key={`${fieldName}-${i}`}>
        <label
          htmlFor={`filter-${fieldName}`}
          onClick={() => onSort(fieldName)}
        >
          {`${displayText} `}
          <Icon name={sortIcon} style={{ fontSize: '12px' }} />
        </label>
        {inputType === 'text' && (
          <input
            type="text"
            id={`filter-${fieldName}`}
            className="form-control studylist-search"
            value={values[fieldName]}
            onChange={e => onValueChange(fieldName, e.target.value)}
          />
        )}
        {inputType === 'date-range' && (
          // https://github.com/airbnb/react-dates
          <CustomDateRangePicker
            // Required
            startDate={studyListDateFilterNumDays ? defaultStartDate : null}
            startDateId="start-date"
            endDate={studyListDateFilterNumDays ? defaultEndDate : null}
            endDateId="end-date"
            // TODO: We need a dynamic way to determine which fields values to update
            onDatesChange={({ startDate, endDate, preset = false }) => {
              onValueChange('studyDateTo', startDate);
              onValueChange('studyDateFrom', endDate);
            }}
            focusedInput={focusedInput}
            onFocusChange={updatedVal => setFocusedInput(updatedVal)}
            // Optional
            numberOfMonths={1} // For med and small screens? 2 for large?
            showClearDates={true}
            anchorDirection="left"
            presets={studyDatePresets}
            hideKeyboardShortcutsPanel={true}
            isOutsideRange={day => !isInclusivelyBeforeDay(day, moment())}
          />
        )}
      </th>
    );
  });
}

TableSearchFilter.propTypes = {
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

TableSearchFilter.defaultProps = {};

export { TableSearchFilter };
export default TableSearchFilter;

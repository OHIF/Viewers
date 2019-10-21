import React, { useState } from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';
import { isInclusivelyBeforeDay } from 'react-dates';
import CustomDateRangePicker from './CustomDateRangePicker.js';
import { Icon } from './../../elements/Icon';

function TableSearchFilter(props) {
  const {
    meta,
    values,
    onSort,
    onValueChange,
    sortFieldName,
    sortDirection,
  } = props;
  const [focusedInput, setFocusedInput] = useState(null);

  const sortIcons = ['sort', 'sort-up', 'sort-down'];
  const sortIconForSortField =
    sortDirection === 'asc' ? sortIcons[1] : sortIcons[2];
  //
  const today = moment();
  const lastWeek = moment().subtract(7, 'day');
  const lastMonth = moment().subtract(1, 'month');
  const defaultStartDate = moment().subtract(365 * 10, 'days'); // this.props.studyListDateFilterNumDays,
  const defaultEndDate = today;
  const studyDatePresets = [
    {
      text: 'Today',
      start: today,
      end: today,
    },
    {
      text: 'Last 7 days',
      start: lastWeek,
      end: today,
    },
    {
      text: 'Last 30 days',
      start: lastMonth,
      end: today,
    },
  ];

  // this.state = {
  //   loading: false,
  //   error: false,

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
            startDate={defaultStartDate}
            startDateId="start-date"
            endDate={defaultEndDate}
            endDateId="end-date"
            onDatesChange={({ startDate, endDate, preset = false }) => {
              // Remove focus and search if...
              // - endDate or preset was just changed
              // - and startDate is set
              // - and endDate is set
              // If... startDate is null, and endDate is null...
              // - clear and search
              console.log(startDate, endDate, preset);
              onValueChange(fieldName, `${startDate}|${endDate}|${preset}`);
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

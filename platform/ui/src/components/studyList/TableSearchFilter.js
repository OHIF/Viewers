import React, { useState } from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';
import { isInclusivelyBeforeDay } from 'react-dates';
import CustomDateRangePicker from './CustomDateRangePicker.js';
import { Icon } from './../../elements/Icon';
import { useTranslation } from 'react-i18next';

const getDateEntry = (datePicked, rangeDatePicked) => {
  return rangeDatePicked || datePicked || null;
};

const getDateEntryFromRange = (today, numOfDays, edge = 'start') => {
  if (typeof numOfDays !== 'number') {
    return;
  }

  if (edge === 'end') {
    return today;
  } else {
    today.subtract(numOfDays, 'days');
  }
};

function TableSearchFilter(props) {
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

  const { studyDateTo, studyDateFrom } = values || {};
  const [focusedInput, setFocusedInput] = useState(null);
  const { t, ready: translationsAreReady } = useTranslation('Common');

  const sortIcons = ['sort', 'sort-up', 'sort-down'];
  const sortIconForSortField =
    sortDirection === 'asc' ? sortIcons[1] : sortIcons[2];

  const today = moment();
  const lastWeek = moment().subtract(7, 'day');
  const lastMonth = moment().subtract(1, 'month');

  const defaultStartDate = getDateEntryFromRange(
    today,
    studyListDateFilterNumDays,
    'start'
  );
  const defaultEndDate = getDateEntryFromRange(
    today,
    studyListDateFilterNumDays,
    'end'
  );

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

  return translationsAreReady
    ? meta.map((field, i) => {
        const { displayText, fieldName, inputType } = field;
        const isSortField = sortFieldName === fieldName;
        const sortIcon = isSortField ? sortIconForSortField : sortIcons[0];

        return (
          <th key={`${fieldName}-${i}`}>
            <label
              htmlFor={`filter-${fieldName}`}
              onClick={() => onSort(fieldName)}
            >
              {`${displayText}`}
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
                startDate={getDateEntry(studyDateFrom, defaultStartDate)}
                startDateId="start-date"
                endDate={getDateEntry(studyDateTo, defaultEndDate)}
                endDateId="end-date"
                // TODO: We need a dynamic way to determine which fields values to update
                onDatesChange={({ startDate, endDate, preset = false }) => {
                  onValueChange('studyDateFrom', startDate);
                  onValueChange('studyDateTo', endDate);
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
      })
    : null;
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

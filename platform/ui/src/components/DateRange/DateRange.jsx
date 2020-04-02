/** REACT DATES */
import 'react-dates/initialize';
import 'react-dates/lib/css/_datepicker.css';
import { DateRangePicker, isInclusivelyBeforeDay } from 'react-dates';
import './DateRange.css';

import React, { useState, useCallback } from 'react';
import PropTypes from 'prop-types';

import moment from 'moment';

const today = moment();
const lastWeek = moment().subtract(7, 'day');
const lastMonth = moment().subtract(1, 'month');
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

const renderYearsOptions = () => {
  const currentYear = moment().year();
  const options = [];

  for (let i = 0; i < 20; i++) {
    const year = currentYear - i;
    options.push(
      <option key={year} value={year}>
        {year}
      </option>
    );
  }

  return options;
};

const DateRange = props => {
  const { onChange, startDate, endDate } = props;
  const [focusedInput, setFocusedInput] = useState(null);
  const renderYearsOptionsCallback = useCallback(renderYearsOptions, []);

  const renderDatePresets = () => {
    return (
      <div className="PresetDateRangePicker_panel flex justify-between">
        {studyDatePresets.map(({ text, start, end }) => {
          return (
            <button
              key={text}
              type="button"
              className={`m-0 py-2 px-3 bg-primary-main border-0 rounded text-white text-base transition duration-300 hover:opacity-80`}
              onClick={() =>
                onChange({
                  startDate: start,
                  endDate: end,
                  preset: true,
                })
              }
            >
              {text}
            </button>
          );
        })}
      </div>
    );
  };
  const renderMonthElement = ({ month, onMonthSelect, onYearSelect }) => {
    renderMonthElement.propTypes = {
      month: PropTypes.object,
      onMonthSelect: PropTypes.func,
      onYearSelect: PropTypes.func,
    };

    const handleMonthChange = event => {
      onMonthSelect(month, event.target.value);
    };

    const handleYearChange = event => {
      onYearSelect(month, event.target.value);
    };

    const handleOnBlur = () => {};

    return (
      <div className="flex justify-center">
        <div className="my-0 mx-1">
          <select
            className="DateRangePicker_select"
            value={month.month()}
            onChange={handleMonthChange}
            onBlur={handleOnBlur}
          >
            {moment.months().map((label, value) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div className="my-0 mx-1">
          <select
            className="DateRangePicker_select"
            value={month.year()}
            onChange={handleYearChange}
            onBlur={handleOnBlur}
          >
            {renderYearsOptionsCallback()}
          </select>
        </div>
      </div>
    );
  };

  return (
    <DateRangePicker
      /** REQUIRED */
      startDate={startDate}
      startDateId={'startDateId'}
      endDate={endDate}
      endDateId={'endDateId'}
      onDatesChange={onChange}
      focusedInput={focusedInput}
      onFocusChange={updatedVal => setFocusedInput(updatedVal)}
      /** OPTIONAL */
      renderCalendarInfo={renderDatePresets}
      renderMonthElement={renderMonthElement}
      startDatePlaceholderText={'Start Date'}
      endDatePlaceholderText={'End Date'}
      phrases={{
        closeDatePicker: 'Close',
        clearDates: 'Clear dates',
      }}
      isOutsideRange={day => !isInclusivelyBeforeDay(day, moment())}
      hideKeyboardShortcutsPanel={true}
      numberOfMonths={1}
      showClearDates={false}
      anchorDirection="left"
    />
  );
};

DateRange.defaultProps = {
  startDate: null,
  endDate: null,
};

DateRange.propTypes = {
  /** Start date moment object */
  startDate: PropTypes.object, // moment date is an object
  /** End date moment object */
  endDate: PropTypes.object, // moment date is an object
  /** Callback that returns on object with selected dates */
  onChange: PropTypes.func.isRequired,
};

export default DateRange;

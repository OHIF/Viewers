/** REACT DATES */
import 'react-dates/initialize';
import 'react-dates/lib/css/_datepicker.css';
import { DateRangePicker, isInclusivelyBeforeDay } from 'react-dates';
import './DateRange.css';

import React, { useState } from 'react';
import PropTypes from 'prop-types';

import moment from 'moment';

const DateRange = props => {
  const { onChange, startDate, endDate } = props;
  const [focusedInput, setFocusedInput] = useState(null);

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

  const renderDatePresets = () => {
    return (
      <div className="PresetDateRangePicker_panel">
        {studyDatePresets.map(({ text, start, end }) => {
          const isSelected = startDate === start && endDate === end;

          return (
            <button
              key={text}
              type="button"
              className={`PresetDateRangePicker_button ${
                isSelected ? 'PresetDateRangePicker_button__selected' : ''
              }`}
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
    const renderYearsOptions = () => {
      const yearsRange = 20;
      const options = [];

      for (let i = 0; i < yearsRange; i++) {
        const year = moment().year() - i;
        options.push(
          <option key={year} value={year}>
            {year}
          </option>
        );
      }

      return options;
    };

    renderMonthElement.propTypes = {
      onMonthSelect: PropTypes.func,
      onYearSelect: PropTypes.func,
    };

    return (
      <div className="flex justify-center">
        <div className="my-0 mx-1">
          <select
            className="DateRangePicker_select"
            value={month.month()}
            onChange={e => onMonthSelect(month, e.target.value)}
          >
            {moment.months().map((label, value) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div className="my-0 mx-1">
          {}
          <select
            className="DateRangePicker_select"
            value={month.year()}
            onChange={e => onYearSelect(month, e.target.value)}
          >
            {renderYearsOptions()}
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

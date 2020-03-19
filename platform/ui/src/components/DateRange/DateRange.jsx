/** REACT DATES */
import 'react-dates/initialize';
import 'react-dates/lib/css/_datepicker.css';
import { DateRangePicker, isInclusivelyBeforeDay } from 'react-dates';
import './DateRange.css';

import React, { useState } from 'react';
import PropTypes from 'prop-types';

import moment from 'moment';

const DateRange = props => {
  const { onDatesChange, startDate, endDate } = props;
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
                onDatesChange({
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
    const containerStyle = {
      margin: '0 5px',
    };

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
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <div style={containerStyle}>
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
        <div style={containerStyle}>
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
      onDatesChange={onDatesChange}
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

DateRange.propTypes = {
  startDate: PropTypes.instanceOf(Date),
  endDate: PropTypes.instanceOf(Date),
  onDatesChange: PropTypes.func.isRequired,
};

export default DateRange;

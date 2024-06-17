import React, { useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';
import { useTranslation } from 'react-i18next';

/** REACT DATES */
import { DateRangePicker, isInclusivelyBeforeDay } from 'react-dates';
import 'react-dates/initialize';
import 'react-dates/lib/css/_datepicker.css';
import './DateRange.css';

const renderYearsOptions = () => {
  const currentYear = moment().year();
  const options = [];

  for (let i = 0; i < 20; i++) {
    const year = currentYear - i;
    options.push(
      <option
        key={year}
        value={year}
      >
        {year}
      </option>
    );
  }

  return options;
};

const DateRange = props => {
  const { id = '', onChange, startDate = null, endDate = null } = props;
  const [focusedInput, setFocusedInput] = useState(null);
  const renderYearsOptionsCallback = useCallback(renderYearsOptions, []);
  const { t } = useTranslation('DatePicker');
  const today = moment();
  const lastWeek = moment().subtract(7, 'day');
  const lastMonth = moment().subtract(1, 'month');
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

  const renderDatePresets = () => {
    return (
      <div className="PresetDateRangePicker_panel flex justify-between">
        {studyDatePresets.map(({ text, start, end }) => {
          return (
            <button
              key={text}
              type="button"
              className={`bg-primary-main m-0 rounded border-0 py-2 px-3 text-base text-white transition duration-300 hover:opacity-80`}
              onClick={() =>
                onChange({
                  startDate: start ? start.format('YYYYMMDD') : undefined,
                  endDate: end ? end.format('YYYYMMDD') : undefined,
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
              <option
                key={value}
                value={value}
              >
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

  // Moment
  const parsedStartDate = startDate ? moment(startDate, 'YYYYMMDD') : null;
  const parsedEndDate = endDate ? moment(endDate, 'YYYYMMDD') : null;

  return (
    <DateRangePicker
      /** REQUIRED */
      startDate={parsedStartDate}
      startDateId={`date-range-${id}-start-date`}
      endDate={parsedEndDate}
      endDateId={`date-range-${id}-end-date`}
      onDatesChange={({ startDate: newStartDate, endDate: newEndDate }) => {
        onChange({
          startDate: newStartDate ? newStartDate.format('YYYYMMDD') : undefined,
          endDate: newEndDate ? newEndDate.format('YYYYMMDD') : undefined,
        });
      }}
      focusedInput={focusedInput}
      onFocusChange={updatedVal => setFocusedInput(updatedVal)}
      /** OPTIONAL */
      renderCalendarInfo={renderDatePresets}
      renderMonthElement={renderMonthElement}
      startDatePlaceholderText={t('Start Date')}
      endDatePlaceholderText={t('End Date')}
      phrases={{
        closeDatePicker: t('Close'),
        clearDates: t('Clear dates'),
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
  id: PropTypes.string,
  /** YYYYMMDD (19921022) */
  startDate: PropTypes.string,
  /** YYYYMMDD (19921022) */
  endDate: PropTypes.string,
  /** Callback that received { startDate: string(YYYYMMDD), endDate: string(YYYYMMDD)} */
  onChange: PropTypes.func.isRequired,
};

export default DateRange;

//  If you want to continue using CSS stylesheets and classes...
//  https://github.com/airbnb/react-dates#initialize
import 'react-dates/initialize';
import 'react-dates/lib/css/_datepicker.css';
import './CustomDateRangePicker.css';

import React from 'react';
import PropTypes from 'prop-types';
import { DateRangePicker } from 'react-dates';
import moment from 'moment';
import i18n from '@ohif/i18n';
import { useTranslation } from 'react-i18next';

function CustomDateRangePicker(props) {
  moment.locale(i18n.language); // using i18n in the date picker

  const { t } = useTranslation('DatePicker');

  const {
    onDatesChange,
    startDate,
    endDate,
    presets,
    ...dateRangePickerProps
  } = props;

  const renderDatePresets = () => {
    const { presets } = props;

    return (
      <div className="PresetDateRangePicker_panel">
        {presets.map(({ text, start, end }) => {
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
        options.push(<option value={year}>{year}</option>);
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
      {...dateRangePickerProps}
      startDate={startDate}
      endDate={endDate}
      renderCalendarInfo={renderDatePresets}
      onDatesChange={onDatesChange}
      renderMonthElement={renderMonthElement}
      startDatePlaceholderText={t('Start Date')}
      endDatePlaceholderText={t('End Date')}
      phrases={{
        closeDatePicker: t('Common:Close'),
        clearDates: t('Clear dates'),
      }}
    />
  );
}

CustomDateRangePicker.propTypes = {
  presets: PropTypes.arrayOf(
    PropTypes.shape({
      text: PropTypes.string,
      start: PropTypes.required,
      end: PropTypes.required,
    })
  ),
  onDatesChange: PropTypes.func.isRequired,
  startDate: PropTypes.instanceOf(Date),
  endDate: PropTypes.instanceOf(Date),
  month: PropTypes.instanceOf(Date),
};

export default CustomDateRangePicker;

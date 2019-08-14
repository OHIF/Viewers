//  If you want to continue using CSS stylesheets and classes...
//  https://github.com/airbnb/react-dates#initialize
import 'react-dates/initialize';
import 'react-dates/lib/css/_datepicker.css';

import React from 'react';
import PropTypes from 'prop-types';
import { DateRangePicker } from 'react-dates';

import './CustomDateRangePicker.styl';

export default class CustomDateRangePicker extends React.Component {
  static propTypes = {
    presets: PropTypes.arrayOf(
      PropTypes.shape({
        text: PropTypes.string,
        start: PropTypes.required,
        end: PropTypes.required,
      })
    ),
  };

  constructor(props) {
    super(props);
    this.state = {
      startDate: this.props.startDate,
      endDate: this.props.endDate,
    };

    this.renderDatePresets = this.renderDatePresets.bind(this);
    this.onDatesChange = this.onDatesChange.bind(this);
  }

  onDatesChange({ startDate, endDate, preset }) {
    this.setState({ startDate, endDate });
    if (this.props.onDatesChange) {
      this.props.onDatesChange({ startDate, endDate, preset });
    }
  }

  renderDatePresets() {
    const { presets } = this.props;
    const { startDate, endDate } = this.state;

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
                this.onDatesChange({
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
  }

  render() {
    let {
      autoFocus,
      autoFocusEndDate,
      initialStartDate,
      initialEndDate,
      stateDateWrapper,
      onDatesChange,
      startDate,
      endDate,
      presets,
      ...dateRangePickerProps
    } = this.props;

    return (
      <div>
        <DateRangePicker
          {...dateRangePickerProps}
          startDate={this.state.startDate}
          endDate={this.state.endDate}
          renderCalendarInfo={this.renderDatePresets}
          onDatesChange={this.onDatesChange}
        />
      </div>
    );
  }
}

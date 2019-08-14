import React, { Component } from 'react';
import PropTypes from 'prop-types';
import './WindowLevelPreferences.styl';

export class WindowLevelPreferences extends Component {
  constructor(props) {
    super(props);

    this.state = {
      data: this.props.windowLevelData,
    };
  }

  static propTypes = {
    windowLevelData: PropTypes.object.isRequired,
    onChange: PropTypes.func,
  };

  onChange(event, key, field) {
    const data = this.state.data;
    const entry = data[key];
    entry[field] = event.target.value;
    this.setState({ data });

    if (this.props.onChange) {
      this.props.onChange(data);
    }
  }

  getWLPreferencesRows(key) {
    const entry = this.state.data[key];
    return (
      <tr key={key}>
        <td className="p-r-1 text-center">{key}</td>
        <td className="p-r-1">
          <label className="wrapperLabel">
            <input
              value={entry.description}
              type="text"
              className="form-control"
              onChange={event => {
                this.onChange(event, key, 'description');
              }}
            />
          </label>
        </td>
        <td className="p-r-1">
          <label className="wrapperLabel">
            <input
              value={entry.window}
              type="number"
              className="form-control"
              onChange={event => {
                this.onChange(event, key, 'window');
              }}
            />
          </label>
        </td>
        <td className="p-r-1">
          <label className="wrapperLabel">
            <input
              value={entry.level}
              type="number"
              className="form-control"
              onChange={event => {
                this.onChange(event, key, 'level');
              }}
            />
          </label>
        </td>
      </tr>
    );
  }

  render() {
    return (
      <table className="full-width">
        <thead>
          <tr>
            <th className="p-x-1 text-center presetIndex">Preset</th>
            <th className="p-x-1">Description</th>
            <th className="p-x-1">Window</th>
            <th className="p-x-1">Level</th>
          </tr>
        </thead>
        <tbody>
          {Object.keys(this.state.data).map(key => {
            return this.getWLPreferencesRows(key);
          })}
        </tbody>
      </table>
    );
  }
}

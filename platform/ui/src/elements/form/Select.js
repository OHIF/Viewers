import './Select.css';

import React, { Component } from 'react';

import PropTypes from 'prop-types';

class Select extends Component {
  constructor(props) {
    super(props);
  }

  static propTypes = {
    options: PropTypes.arrayOf(
      PropTypes.shape({
        key: PropTypes.string.isRequired,
        value: PropTypes.string.isRequired,
      })
    ),
    value: PropTypes.string,
    onChange: PropTypes.func,
  };

  render() {
    return (
      <div className="select-ohif-container">
        <label className="select-ohif-label" htmlFor={this.id}>
          {this.props.label}
          <select
            className="select-ohif"
            {...this.props}
          >
            {this.props.options.map(({ key, value }) => {
              return (
                <option key={key} value={value}>
                  {key}
                </option>
              );
            })}
          </select>
        </label>

      </div>

    );
  }
}

export { Select };

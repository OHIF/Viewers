import './Select.css';

import React, { Component } from 'react';

import PropTypes from 'prop-types';

class Select extends Component {
  constructor(props) {
    super(props);
    this.state = { value: this.props.value };
  }

  handleChange = event => {
    this.setState({ value: event.target.value });
    if (this.props.onChange) this.props.onChange();
  };

  render() {
    return (
      <select
        className="select-ohif"
        value={this.state.selected}
        onChange={this.handleChange}
      >
        {this.props.options.map(({ key, value }) => {
          return (
            <option key={key} value={value}>
              {key}
            </option>
          );
        })}
      </select>
    );
  }
}

Select.propTypes = {
  options: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string.isRequired,
      value: PropTypes.string.isRequired,
    })
  ),
  value: PropTypes.string,
  onChange: PropTypes.func,
};

export { Select };

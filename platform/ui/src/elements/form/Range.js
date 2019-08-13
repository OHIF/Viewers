import './Range.css';

import React, { Component } from 'react';
import PropTypes from 'prop-types';

class Range extends React.Component {
  constructor(props) {
    super(props);
    this.state = { value: props.value };
  }

  handleChange = event => {
    this.setState({ value: event.target.value });
    if (this.props.onChange) this.props.onChange();
  };

  render() {
    return (
      <input
        type="range"
        value={this.state.value}
        min={this.props.min}
        max={this.props.max}
        onChange={this.handleChange}
        id={this.props.id}
        className="range"
      />
    );
  }
}

Range.propTypes = {
  value: PropTypes.number,
  min: PropTypes.number.isRequired,
  max: PropTypes.number.isRequired,
  id: PropTypes.string,
  onChange: PropTypes.func,
};

export { Range };

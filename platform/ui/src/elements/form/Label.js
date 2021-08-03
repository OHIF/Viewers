import './Label.css';

import React from 'react';

import PropTypes from 'prop-types';

class Label extends React.Component {
  constructor(props) {
    super(props);
    this.state = { value: this.props.text };
  }

  render() {
    return (
      <label className="label-ohif" htmlFor={this.props.for}>
        {this.props.text}
      </label>
    );
  }
}

Label.propTypes = {
  text: PropTypes.string.isRequired,
  for: PropTypes.string,
};

export { Label };

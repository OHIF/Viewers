import './TextInput.css';

import React from 'react';
import PropTypes from 'prop-types';

class TextInput extends React.Component {
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
        className="input-ohif"
        type="text"
        value={this.state.value}
        onChange={this.handleChange}
        id={this.props.id}
      />
    );
  }
}

TextInput.propTypes = {
  value: PropTypes.string,
  id: PropTypes.string,
  onChange: PropTypes.func,
};

export { TextInput };

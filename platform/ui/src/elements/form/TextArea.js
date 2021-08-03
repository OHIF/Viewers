import './TextArea.css';

import React from 'react';
import PropTypes from 'prop-types';

class TextArea extends React.Component {
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
      <textarea
        className="textarea-ohif"
        value={this.state.value}
        Rows={this.props.Rows}
        cols={this.props.cols}
        onChange={this.handleChange}
        id={this.props.id}
      />
    );
  }
}

TextArea.propTypes = {
  value: PropTypes.string,
  Rows: PropTypes.number,
  cols: PropTypes.number,
  id: PropTypes.string,
  onChange: PropTypes.func,
};

export { TextArea };

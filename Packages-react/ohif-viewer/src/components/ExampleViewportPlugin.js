import React, { Component } from "react";
import PropTypes from 'prop-types';

class ExampleViewportPlugin extends Component {
  static propTypes = {
    studyInstanceUid: PropTypes.string.isRequired,
    seriesInstanceUid: PropTypes.string.isRequired
  };

  static defaultProps = {
    studyInstanceUid: '',
    seriesInstanceUid: ''
  };

  render() {
    return (<div className="ExampleViewportPlugin">
        <p>StudyInstanceUid: {this.props.studyInstanceUid}</p>
        <p>SeriesInstanceUid: {this.props.seriesInstanceUid}</p>
      </div>
    );
  }
}

export default ExampleViewportPlugin;

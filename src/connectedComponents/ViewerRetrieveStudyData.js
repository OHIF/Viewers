import React, { Component } from 'react';
import PropTypes from 'prop-types';
import OHIF from 'ohif-core';
import ConnectedViewer from './ConnectedViewer.js';

const { createDisplaySets } = OHIF.utils;

class ViewerRetrieveStudyData extends Component {
  static propTypes = {
    studyInstanceUids: PropTypes.array.isRequired,
    seriesInstanceUids: PropTypes.array,
    server: PropTypes.object,
  };

  state = {
    studies: null,
    error: null,
  };

  componentDidMount() {
    // TODO: Avoid using timepoints here
    //const params = { studyInstanceUids, seriesInstanceUids, timepointId, timepointsFilter={} };
    const { studyInstanceUids, seriesInstanceUids, server } = this.props;
    const promise = OHIF.studies.retrieveStudiesMetadata(
      server,
      studyInstanceUids,
      seriesInstanceUids
    );

    // Render the viewer when the data is ready
    promise
      .then(studies => {
        const updatedStudies = createDisplaySets(studies);

        this.setState({
          studies: updatedStudies,
        });
      })
      .catch(error => {
        this.setState({
          error: true,
        });

        throw new Error(error);
      });
  }

  render() {
    if (this.state.error) {
      return <div>Error: {JSON.stringify(this.state.error)}</div>;
    } else if (!this.state.studies) {
      return <div>Loading...</div>;
    }

    return (
      <ConnectedViewer
        studies={this.state.studies}
        studyInstanceUids={this.props.studyInstanceUids}
      />
    );
  }
}

export default ViewerRetrieveStudyData;

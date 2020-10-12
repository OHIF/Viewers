import React, { Component } from 'react';
import PropTypes from 'prop-types';
import stateDetails from './state';
import cornerstone from 'cornerstone-core';

class ResultsSection extends Component {
  render() {
    return (
      <div id="results-section-wrapper">
        <p className="text-bold">Annotations:</p>
        <p>Expert radiologist indicated suspicious area for this patient.</p>
        <br />

        <p className="text-bold">Procedure:</p>
        <p>The patient underwent MR-guidance biopsies.</p>
        <br />

        <p className="text-bold">Biopsy results:</p>
        <p>
            {stateDetails.predictionResults.prediction}
        </p>
        <br />

        <p className="text-bold">Analysis of your findings:</p>
        <p>{stateDetails.predictionResults.probability}</p>
      </div>
    );
  }
}

export default ResultsSection;

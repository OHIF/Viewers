import React, { Component } from 'react';
import PropTypes from 'prop-types';
import stateDetails from './state';
import cornerstone from 'cornerstone-core';

class ResultsSection extends Component {
  render() {
    const resultsItems = stateDetails.predictionResults.map(
      ({ title, description }) => (
        <div className="result-individual-section">
          <p className="text-bold">{title}</p>
          <p>{description}</p>
        </div>
      )
    );

    const noResultsAvailable = (
      <div className="no-results-available">
        <h3>No Results Available</h3>
      </div>
    );

    return (
      <div id="results-section-wrapper">
        <div className="form-group">
          <label className="form-label" htmlFor="ai-models">
            Gained Results
          </label>
        </div>
        {resultsItems && resultsItems.length
          ? resultsItems
          : noResultsAvailable}
      </div>
    );
  }
}

export default ResultsSection;

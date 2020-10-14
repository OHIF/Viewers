import React, { Component } from 'react';
import PropTypes from 'prop-types';
import stateDetails from '../state';
import cornerstone from 'cornerstone-core';
import DiagnosisReportModal from './DiagnosisReportModal';

class ResultsSection extends Component {
  handleGenerateReport = event => {
    const { UIModalService } = this.props.servicesManager.services;
    const textareaReport = document.getElementById('report-text');

    const WrappedDebugReportModal = function() {
      return (
        <DiagnosisReportModal
          mailTo={true}
          reportText={textareaReport.value}
          prediction={stateDetails.predictionResults}
        />
      );
    };

    UIModalService.show({
      content: WrappedDebugReportModal,
      title: `Report Information`,
    });
  };

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

        {resultsItems && resultsItems.length ? (
          <div className="report-section">
            <textarea className="report" id="report-text"></textarea>
            <button className="btn btn-sm" onClick={this.handleGenerateReport}>
              Generate Report
            </button>
          </div>
        ) : null}
      </div>
    );
  }
}

export default ResultsSection;

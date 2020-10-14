import React, { Component } from 'react';
import PropTypes from 'prop-types';
import stateDetails from '../state';
import cornerstone from 'cornerstone-core';
import { ToolbarButton } from '@ohif/ui';
import { detect } from 'detect-browser';

class DiagnosisReportModal extends Component {
  render() {
    const mailToFunction = event => {
      const subject = encodeURI(`Diagnosis Report`);
      let body = getEmailBody();

      body = encodeURI(body);

      window.location.href = `mailto:${this.props.mailTo}?subject=${subject}&body=${body}`;
    };

    const getEmailBody = () => {
      let body = `============= DIAGNOSIS INFO =============\n\n`;

      // Report description
      body += '== Report Description ==\n';
      body += `Diagnosis\t ${this.props.reportText}\n\n`;

      // AI Prediction
      body += '== AI Prediction ==\n';
      this.props.prediction.map(
        ({ title, description }) => (body += `${title}\t ${description}\n`)
      );
      body += `\n`;

      // App version
      body += '== App ==\n';
      body += `version\t${window.version}\n\n`;

      // Study URL
      body += '== URL ==\n';
      body += `URL\t ${window.location.href}\n\n`;

      return body;
    };

    const downloadDiagnosisData = () => {
      const text = getEmailBody();
      const fileType = 'text/csv';
      const fileName = 'DiagnosisReport';

      var blob = new Blob([text], { type: fileType });

      var a = document.createElement('a');
      a.download = fileName;
      a.href = URL.createObjectURL(blob);
      a.dataset.downloadurl = [fileType, a.download, a.href].join(':');
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(function() {
        URL.revokeObjectURL(a.href);
      }, 1500);
    };

    const copyDiagnosisDataToClipboard = event => {
      const body = getEmailBody();

      const textArea = document.createElement('textarea');

      textArea.value = body;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    };

    const getAIPrediction = prediction => {
      const resultsItems = prediction.map(({ title, description }) => (
        <tr>
          <td>{title}</td>
          <td>{description}</td>
        </tr>
      ));

      return (
        <React.Fragment>
          <tr>
            <th className="diagnosisReportModalHeader">AI Prediction</th>
          </tr>
          {resultsItems}
        </React.Fragment>
      );
    };

    const getAppVersion = () => {
      return (
        <React.Fragment>
          <tr>
            <th className="diagnosisReportModalHeader">App</th>
          </tr>
          <tr>
            <td>Version</td>
            <td>{window.version}</td>
          </tr>
        </React.Fragment>
      );
    };

    const getCurrentStudyUrl = () => {
      return (
        <React.Fragment>
          <tr>
            <th className="diagnosisReportModalHeader">URL</th>
          </tr>
          <tr>
            <td>URL</td>
            <td>{window.location.href}</td>
          </tr>
        </React.Fragment>
      );
    };

    const getReportDescription = reportText => {
      return (
        <React.Fragment>
          <tr>
            <th className="diagnosisReportModalHeader">Diagnosis Report</th>
          </tr>
          <tr>
            <td>Diagnosis</td>
            <td>{reportText}</td>
          </tr>
        </React.Fragment>
      );
    };

    return (
      <div id="report-section-wrapper">
        <div className="diagnosis-report-modal-buttons-container">
          {this.props.mailTo ? (
            <div>
              <ToolbarButton
                label={'Send Diagnosis Email'}
                onClick={mailToFunction}
                icon={'envelope-square'}
                isActive={false}
              />
            </div>
          ) : null}
          <div>
            <ToolbarButton
              label={'Copy To Clipboard'}
              onClick={copyDiagnosisDataToClipboard}
              icon={'clipboard'}
              isActive={false}
            />
          </div>
          <div>
            <ToolbarButton
              label={'Download as a TXT'}
              onClick={downloadDiagnosisData}
              icon={'plus'}
              isActive={false}
            />
          </div>
        </div>
        <div>
          <table>
            {getReportDescription(this.props.reportText)}
            {getAIPrediction(this.props.prediction)}
            {getAppVersion()}
            {getCurrentStudyUrl()}
          </table>
        </div>
      </div>
    );
  }
}

export default DiagnosisReportModal;

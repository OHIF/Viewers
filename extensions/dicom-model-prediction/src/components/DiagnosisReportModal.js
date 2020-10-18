import React, { Component } from 'react';
import PropTypes from 'prop-types';
import stateDetails from '../state';
import cornerstone from 'cornerstone-core';
import { ToolbarButton } from '@ohif/ui';
import { detect } from 'detect-browser';

class DiagnosisReportModal extends Component {
  render() {
    const mailToFunction = event => {
      const StudyInstanceUID = this.props.series.studyInstanceUID;
      const subject = encodeURI(`Diagnosis Report: ${StudyInstanceUID}`);
      let body = getEmailBody();

      body = encodeURI(body);

      window.location.href = `mailto:${this.props.mailTo}?subject=${subject}&body=${body}`;
    };

    const getEmailBody = () => {
      let body = `============= DIAGNOSIS REPORT INFO =============\n\n`;

      // Report description
      body += '== Diagnosis Report ==\n';
      body += `Comment\t ${this.props.reportText}\n\n`;

      // AI Prediction
      body += '== AI Prediction ==\n';
      this.props.prediction.map(
        ({ title, description }) => (body += `${title}\t ${description}\n`)
      );
      body += `\n`;

      // Series Details
      body += '== Series Details ==\n';
      if (this.props.series.modality) {
        body += `Modality\t${this.props.series.modality}\n`;
      }
      if (this.props.series.seriesInstanceUID) {
        body += `Series Instance UID\t${this.props.series.seriesInstanceUID}\n`;
      }
      if (this.props.series.seriesDate && this.props.series.seriesDate.day) {
        body += `Series Date\t${this.props.series.seriesDate.day}/${this.props.series.seriesDate.month}/${this.props.series.seriesDate.year}\n`;
      }
      if (this.props.series.seriesNumber) {
        body += `Series Number\t${this.props.series.seriesNumber}\n`;
      }
      if (this.props.series.studyInstanceUID) {
        body += `Study Instance UID\t${this.props.series.studyInstanceUID}\n`;
      }
      body += `\n`;

      // Study Details
      body += '== Study Details ==\n';
      if (this.props.study.accessionNumber) {
        body += `Accession Number\t${this.props.study.accessionNumber}\n`;
      }
      if (this.props.study.studyDescription) {
        body += `Series Instance UID\t${this.props.study.studyDescription}\n`;
      }
      if (!(this.props.study.accessionNumber && this.props.study.studyDescription)) {
        body += `N/A\n`;
      }
      body += `\n`;

      // Patient Details
      body += '== Patent Details ==\n';
      if (this.props.patient.patientId) {
        body += `Patient ID\t${this.props.patient.patientId}\n`;
      }
      if (this.props.patient.patientName) {
        body += `Patient Name\t${this.props.patient.patientName}\n`;
      }
      if (!(this.props.patient.patientName && this.props.patient.patientId)) {
        body += `N/A\n`;
      }
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
      const StudyInstanceUID = this.props.series.studyInstanceUID;

      const text = getEmailBody();
      const fileType = 'txt';
      const fileName = `DiagnosisReport`;

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
      console.log(this.props)
      const UINotificationService = this.props.notificationService;
      const body = getEmailBody();
      const textArea = document.createElement('textarea');

      textArea.value = body;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      UINotificationService.show({
        title: 'Success',
        message: 'Successfully copied the report to the clipboard.',
        position: 'bottomLeft',
        duration: 4000,
        type: 'success',
      });
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
            <td>Comment</td>
            <td>{reportText}</td>
          </tr>
        </React.Fragment>
      );
    };

    const getSeriesDetails = series => {
      return (
        <React.Fragment>
          <tr>
            <th className="diagnosisReportModalHeader">Series Details</th>
          </tr>
          {series.modality ? (
            <tr>
              <td>Modality</td>
              <td>{series.modality}</td>
            </tr>
          ) : null}
          {series.seriesInstanceUID ? (
            <tr>
              <td>Series Instance UID</td>
              <td>{series.seriesInstanceUID}</td>
            </tr>
          ) : null}
          {series.seriesDate && series.seriesDate.day ? (
            <tr>
              <td>Series Date</td>
              <td>
                {series.seriesDate.day}/{series.seriesDate.month}/
                {series.seriesDate.year}
              </td>
            </tr>
          ) : null}
          {series.seriesNumber ? (
            <tr>
              <td>Series Number</td>
              <td>{series.seriesNumber}</td>
            </tr>
          ) : null}
          {series.studyInstanceUID ? (
            <tr>
              <td>Study Instance UID</td>
              <td>{series.studyInstanceUID}</td>
            </tr>
          ) : null}
        </React.Fragment>
      );
    };

    const getStudyDetails = study => {
      return (
        <React.Fragment>
          <tr>
            <th className="diagnosisReportModalHeader">Study Details</th>
          </tr>
          {study.accessionNumber ? (
            <tr>
              <td>Accession Number</td>
              <td>{study.accessionNumber}</td>
            </tr>
          ) : null}
          {study.studyDescription ? (
            <tr>
              <td>Series Instance UID</td>
              <td>{study.studyDescription}</td>
            </tr>
          ) : null}
          {study.accessionNumber && study.studyDescription ? null : (
            <tr>
              <td>N/A</td>
            </tr>
          )}
        </React.Fragment>
      );
    };

    const getPatientDetails = patient => {
      return (
        <React.Fragment>
          <tr>
            <th className="diagnosisReportModalHeader">Patient Details</th>
          </tr>
          {patient.patientId ? (
            <tr>
              <td>Patient ID</td>
              <td>{patient.patientId}</td>
            </tr>
          ) : null}
          {patient.patientName ? (
            <tr>
              <td>Patient Name</td>
              <td>{patient.patientName}</td>
            </tr>
          ) : null}
          {patient.patientName && patient.patientId ? null : (
            <tr>
              <td>N/A</td>
            </tr>
          )}
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
            {getSeriesDetails(this.props.series)}
            {getStudyDetails(this.props.study)}
            {getPatientDetails(this.props.patient)}
            {getAppVersion()}
            {getCurrentStudyUrl()}
          </table>
        </div>
      </div>
    );
  }
}

export default DiagnosisReportModal;

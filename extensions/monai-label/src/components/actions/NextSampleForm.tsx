/*
Copyright (c) MONAI Consortium
Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at
    http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

import React, { Component } from 'react';

import './NextSampleForm.css';
import PropTypes from 'prop-types';

export default class NextSampleForm extends Component {
  static propTypes = {
    info: PropTypes.any,
  };

  constructor(props) {
    super(props);
  }

  onSubmit = () => {
    // TODO:: OHIF Doesn't support loading exact series in URI
    const path = window.location.href.split('=');
    path[path.length - 1] = this.props.info.StudyInstanceUID;

    const pathname = path.join('=');
    console.info(pathname);

    const msg =
      'This action will reload current page.  Are you sure to continue?';
    if (!window.confirm(msg)) {
      return;
    }
    window.location.href = pathname;
  };

  render() {
    const fields = {
      Modality: 'Modality',
      StudyDate: 'Study Date',
      StudyTime: 'Study Time',
      PatientID: 'Patient ID',
      StudyInstanceUID: 'Study Instance UID',
      SeriesInstanceUID: 'Series Instance UID',
    };
    return (
      <div className="nextSampleForm">
        <table className="optionsTable">
          <thead>
            <tr>
              <th style={{ width: '30%' }}>Field</th>
              <th>Value</th>
            </tr>
          </thead>
          <tbody>
            {Object.keys(fields).map((field) => (
              <tr key={field}>
                <td>{fields[field]}</td>
                {field === 'SeriesInstanceUID' ? (
                  <td>
                    <a
                      rel="noreferrer noopener"
                      target="_blank"
                      href={this.props.info['RetrieveURL']}
                    >
                      {this.props.info[field]}
                    </a>
                  </td>
                ) : (
                  <td>{this.props.info[field]}</td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        <br />
        <div className="mb-3 text-right">
          <button
            className="actionButton"
            type="submit"
            onClick={this.onSubmit}
          >
            OK
          </button>
        </div>
      </div>
    );
  }
}

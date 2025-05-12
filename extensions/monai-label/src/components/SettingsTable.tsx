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

import './SettingsTable.css';
import { Icons } from '@ohif/ui-next';
import { CookieUtils } from '../utils/GenericUtils';
export default class SettingsTable extends Component {
  onInfo: any;

  constructor(props) {
    super(props);
    this.onInfo = props.onInfo;

    const url = CookieUtils.getCookieString(
      'MONAILABEL_SERVER_URL',
      'http://' + window.location.host.split(':')[0] + ':8000/'
    );
    const overlap_segments = CookieUtils.getCookieBool(
      'MONAILABEL_OVERLAP_SEGMENTS',
      true
    );
    const export_format = CookieUtils.getCookieString(
      'MONAILABEL_EXPORT_FORMAT',
      'NRRD'
    );

    this.state = {
      url: url,
      overlap_segments: overlap_segments,
      export_format: export_format,
    };
  }

  onBlurSeverURL = (evt) => {
    const url = evt.target.value;
    this.setState({ url: url });
    CookieUtils.setCookie('MONAILABEL_SERVER_URL', url);
    console.log('Settings onBlurSeverURL', url);
  };

  onConnect = () => {
    const url = document.getElementById('monailabelServerURL').value;
    this.setState({ url: url });
    CookieUtils.setCookie('MONAILABEL_SERVER_URL', url);
    console.log('Connecting Server', url);
    this.onInfo(url);
    console.log('Settings onConnect', url);
  };

  render() {
    return (
      <table className="settingsTable">
        <tbody>
          <tr>
            <td colSpan={3}>Server:</td>
          </tr>
          <tr>
            <td>
              <input
                id="monailabelServerURL"
                className="actionInput"
                name="monailabelServerURL"
                type="text"
                defaultValue={this.state.url}
                onBlur={this.onBlurSeverURL}
              />
            </td>
            <td>&nbsp;</td>
            <td>
              <button className="actionButton" onClick={this.onConnect}>
                <Icons.ToolReset className="w-[12px] h-[12px]" />
                {/* <Icon name="tool-reset" width="12px" height="12px" /> */}
              </button>
            </td>
          </tr>
          <tr style={{ fontSize: 'smaller' }}>
            <td colSpan={3}>
              <a
                href={new URL(this.state.url).toString() + 'info/'}
                target="_blank"
                rel="noopener noreferrer"
              >
                Info
              </a>
              <b>&nbsp;&nbsp;|&nbsp;&nbsp;</b>
              <a
                href={new URL(this.state.url).toString() + 'logs/?lines=100'}
                target="_blank"
                rel="noopener noreferrer"
              >
                Logs
              </a>
            </td>
          </tr>
        </tbody>
      </table>
    );
  }
}

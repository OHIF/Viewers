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
import './OptionsForm.css';

import OptionTable from './OptionTable';
import PropTypes from 'prop-types';

export default class OptionsForm extends Component {
  static propTypes = {
    info: PropTypes.any,
    config: PropTypes.any,
  };
  private configs = {};

  constructor(props) {
    super(props);

    this.state = {
      config: { ...props.config },
      section: '',
      name: '',
    };
  }

  getConfigs() {
    const { info } = this.props;
    const mapping = {
      infer: 'models',
      train: 'trainers',
      activelearning: 'strategies',
      scoring: 'scoring',
    };

    if (!Object.keys(this.configs).length) {
      Object.entries(mapping).forEach(([m, n]) => {
        const obj = info && info.data && info.data[n] ? info.data[n] : {};
        Object.entries(obj).forEach(([k, v]) => {
          if (v && v.config && Object.keys(v.config).length) {
            if (!this.configs[m]) {
              this.configs[m] = {};
            }
            this.configs[m][k] = v.config;
          }
        });
      });
    }
    return this.configs;
  }

  getSection() {
    return this.state.section.length && this.configs[this.state.section]
      ? this.state.section
      : Object.keys(this.configs).length
        ? Object.keys(this.configs)[0]
        : '';
  }

  getSectionMap(section) {
    return section && this.configs[section]
      ? this.configs[section]
      : Object.keys(this.configs).length
        ? this.configs[Object.keys(this.configs)[0]]
        : {};
  }

  getName(section_map) {
    return this.state.name.length && section_map[this.state.name]
      ? this.state.name
      : Object.keys(section_map).length
        ? Object.keys(section_map)[0]
        : '';
  }

  getNameMap(name, section_map) {
    return name && section_map[name]
      ? section_map[name]
      : Object.keys(section_map).length
        ? section_map[Object.keys(section_map)[0]]
        : {};
  }

  onChangeSection = (evt) => {
    this.setState({ section: evt.target.value });
  };

  onChangeName = (evt) => {
    this.setState({ name: evt.target.value });
  };

  onReset = () => {
    console.log('Reset the config map');
    this.configs = {};
    this.setState({
      config: {},
      section: '',
      name: '',
    });
  };

  onChangeConfig = (s, n, k, evt) => {
    // console.log(s + ' => ' + n + ' => ' + k, evt);
    const c = { ...this.state.config };
    if (!c[s]) {
      c[s] = {};
    }
    if (!c[s][n]) {
      c[s][n] = {};
    }

    if (typeof this.configs[s][n][k] === 'boolean') {
      c[s][n][k] = !!evt.target.checked;
    } else {
      if (typeof this.configs[s][n][k] === 'number') {
        c[s][n][k] = Number.isInteger(this.configs[s][n][k])
          ? parseInt(evt.target.value)
          : parseFloat(evt.target.value);
      } else {
        c[s][n][k] = evt.target.value;
      }
    }
    this.setState({ config: c });
  };

  render() {
    // console.log('Render Options Table..');
    // console.log('State Config: ', this.state.config);

    const config = this.getConfigs();
    const section = this.getSection();
    const section_map = this.getSectionMap(section);
    const name = this.getName(section_map);
    const name_map = this.getNameMap(name, section_map);
    const update_map = {};

    // console.log('Config State: ', this.state.config);
    Object.keys(name_map).forEach((k) => {
      if (this.state.config[section] && this.state.config[section][name]) {
        const x = this.state.config[section][name][k];
        if (x !== null && x !== undefined) {
          update_map[k] = x;
        }
      }
    });
    // console.log('Update Map: ', update_map);

    return (
      <div className="optionsForm">
        <table className="optionsSection">
          <tbody>
            <tr>
              <td>Section:</td>
              <td>
                <select
                  className="selectBox"
                  name="selectSection"
                  onChange={this.onChangeSection}
                  defaultValue={section}
                >
                  {Object.keys(config).map((k) => (
                    <option key={k} value={k}>
                      {`${k} `}
                    </option>
                  ))}
                </select>
              </td>
            </tr>
            <tr>
              <td>Name:</td>
              <td>
                <select
                  className="selectBox"
                  name="selectName"
                  onChange={this.onChangeName}
                  defaultValue={name}
                >
                  {Object.keys(section_map).map((k) => (
                    <option key={k} value={k}>
                      {`${k} `}
                    </option>
                  ))}
                </select>
              </td>
            </tr>
            <tr>
              <td colSpan={2}>&nbsp;</td>
            </tr>
          </tbody>
        </table>
        <OptionTable
          section={section}
          name={name}
          name_map={name_map}
          update_map={update_map}
          onChangeConfig={this.onChangeConfig}
        />
      </div>
    );
  }
}

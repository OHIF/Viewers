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

import PropTypes from 'prop-types';

export default class OptionTable extends Component {
  static propTypes = {
    section: PropTypes.string,
    name: PropTypes.string,
    name_map: PropTypes.any,
    update_map: PropTypes.any,
    onChangeConfig: PropTypes.func,
  };

  state = {
    seed: 0,
  };

  componentDidUpdate(prevProps, prevState) {
    if (prevProps.update_map !== this.props.update_map) {
      // console.log('update_map - Prop changed!');
      if (!Object.keys(this.props.update_map).length) {
        // console.log('Forcing the update.');
        this.setState({ seed: Math.random() });
        return;
      }

      Object.entries(this.props.update_map).map(([k, v]) => {
        const e = document.getElementById(
          this.props.section + this.props.name + k
        );
        if (e.type === 'checkbox') {
          e.checked = v;
        } else {
          e.value = v;
        }
      });
    }
  }

  render() {
    const { section, name, name_map } = this.props;
    const { seed } = this.state;
    // console.log('Render Table Object: ' + seed);
    return (
      <div className="optionsConfig">
        <table className="optionsConfigTable">
          <thead>
            <tr>
              <th>Key</th>
              <th>Value</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(name_map).map(([k, v]) => (
              <tr key={seed + section + name + k}>
                <td>{k}</td>
                <td>
                  {v !== null && typeof v === 'boolean' ? (
                    <input
                      id={section + name + k}
                      type="checkbox"
                      defaultChecked={v}
                      onChange={(e) =>
                        this.props.onChangeConfig(section, name, k, e)
                      }
                    />
                  ) : v !== null && typeof v === 'object' ? (
                    <select
                      id={section + name + k}
                      className="optionsInput"
                      onChange={(e) =>
                        this.props.onChangeConfig(section, name, k, e)
                      }
                    >
                      {Object.entries(v).map(([a, b]) => (
                        <option key={a} name={a} value={b}>
                          {b}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      id={section + name + k}
                      type="text"
                      defaultValue={v ? '' + v : ''}
                      className="optionsInput"
                      onChange={(e) =>
                        this.props.onChangeConfig(section, name, k, e)
                      }
                    />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }
}

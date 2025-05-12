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

import './ModelSelector.css';

export default class ModelSelector extends Component {
  static propTypes = {
    name: PropTypes.string,
    title: PropTypes.string,
    models: PropTypes.array,
    currentModel: PropTypes.string,
    usage: PropTypes.any,
    onClick: PropTypes.func,
    onSelectModel: PropTypes.func,
  };

  constructor(props) {
    super(props);

    const currentModel = props.currentModel
      ? props.currentModel
      : props.models.length > 0
        ? props.models[0]
        : '';
    this.state = {
      models: props.models,
      currentModel: currentModel,
      buttonDisabled: false,
    };
  }

  static getDerivedStateFromProps(props, current_state) {
    if (current_state.models !== props.models) {
      return {
        models: props.models,
        currentModel: props.models.length > 0 ? props.models[0] : '',
      };
    }
    return null;
  }

  onChangeModel = (evt) => {
    this.setState({ currentModel: evt.target.value });
    if (this.props.onSelectModel) {
      this.props.onSelectModel(evt.target.value);
    }
  };

  currentModel = () => {
    return this.props.currentModel
      ? this.props.currentModel
      : this.state.currentModel;
  };

  onClickBtn = async () => {
    if (this.state.buttonDisabled) {
      return;
    }

    let model = this.state.currentModel;
    if (!model) {
      console.error('This should never happen!');
      model = this.props.models.length > 0 ? this.props.models[0] : '';
    }

    this.setState({ buttonDisabled: true });
    await this.props.onClick(model);
    this.setState({ buttonDisabled: false });
  };

  render() {
    const currentModel = this.currentModel();
    return (
      <div className="modelSelector">
        <table>
          <tbody>
            <tr>
              <td colSpan="3">Models:</td>
            </tr>
            <tr>
              <td width="80%">
                <select
                  className="selectBox"
                  onChange={this.onChangeModel}
                  defaultValue={currentModel}
                >
                  {this.props.models.map((model) => (
                    <option key={model} name={model} value={model}>
                      {`${model} `}
                    </option>
                  ))}
                </select>
              </td>
              <td width="2%">&nbsp;</td>
              <td width="18%">
                <button
                  className="actionButton"
                  onClick={this.onClickBtn}
                  title={'Run ' + this.props.title}
                  disabled={
                    this.state.isButtonDisabled || !this.props.models.length
                  }
                  style={{ display: this.props.onClick ? 'block' : 'none' }}
                >
                  Run
                </button>
              </td>
            </tr>
          </tbody>
        </table>
        {this.props.usage}
      </div>
    );
  }
}

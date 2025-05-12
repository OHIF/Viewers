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

import React from 'react';

import BaseTab from './BaseTab';
import NextSampleForm from './NextSampleForm';

export default class OptionTable extends BaseTab {
  constructor(props) {
    super(props);
    this.state = {
      strategy: 'random',
      training: false,
      segmentId: 'liver',
    };
  }

  onClickNextSample = async () => {
    const nid = this.notification.show({
      title: 'MONAI Label',
      message: 'Running Active Learning strategy - ' + this.state.strategy,
      type: 'info',
      duration: 60000,
    });

    const strategy = this.state.strategy;
    const config = this.props.onOptionsConfig();
    const params =
      config && config.activelearning && config.activelearning[strategy]
        ? config.activelearning[strategy]
        : {};
    const response = await this.props.client().next_sample(strategy, params);
    if (!nid) {
      window.snackbar.hideAll();
    } else {
      this.notification.hide(nid);
    }

    if (response.status !== 200) {
      this.notification.show({
        title: 'MONAI Label',
        message: 'Failed to Fetch Next Sample',
        type: 'error',
        duration: 5000,
      });
    } else {
      this.uiModelService.show({
        content: NextSampleForm,
        contentProps: {
          info: response.data,
        },
        shouldCloseOnEsc: true,
        title: 'Active Learning - Next Sample',
        customClassName: 'nextSampleForm',
      });
    }
  };

  onClickUpdateModel = async () => {
    const training = this.state.training;
    console.debug('Current training status: ' + training);
    const config = this.props.onOptionsConfig();
    const params = config && config.train ? config.train : {};

    const response = training
      ? await this.props.client().stop_train()
      : await this.props.client().run_train(params);

    if (response.status !== 200) {
      this.notification.show({
        title: 'MONAI Label',
        message: 'Failed to ' + (training ? 'STOP' : 'RUN') + ' training',
        type: 'error',
        duration: 5000,
      });
    } else {
      this.notification.show({
        title: 'MONAI Label',
        message: 'Model update task ' + (training ? 'STOPPED' : 'STARTED'),
        type: 'success',
        duration: 2000,
      });
      this.setState({ training: !training });
    }
  };

  async componentDidMount() {
    const training = await this.props.client().is_train_running();
    this.setState({ training: training });
  }

  render() {
    const ds = this.props.info.data.datastore;
    const completed = ds && ds.completed ? ds.completed : 0;
    const total = ds && ds.total ? ds.total : 1;
    const activelearning = Math.round(100 * (completed / total)) + '%';
    const activelearningTip = completed + '/' + total + ' samples annotated';

    const ts = this.props.info.data.train_stats
      ? Object.values(this.props.info.data.train_stats)[0]
      : null;

    const epochs = ts ? (ts.total_time ? 0 : ts.epoch ? ts.epoch : 1) : 0;
    const total_epochs = ts && ts.total_epochs ? ts.total_epochs : 1;
    const training = Math.round(100 * (epochs / total_epochs)) + '%';
    const trainingTip = epochs
      ? epochs + '/' + total_epochs + ' epochs completed'
      : 'Not Running';

    const accuracy =
      ts && ts.best_metric ? Math.round(100 * ts.best_metric) + '%' : '0%';
    const accuracyTip =
      ts && ts.best_metric
        ? accuracy + ' is current best metric'
        : 'not determined';

    const strategies = this.props.info.data.strategies
      ? this.props.info.data.strategies
      : {};

    return (
      <div className="tab">
        <input
          className="tab-switch"
          type="checkbox"
          id={this.tabId}
          name="activelearning"
          defaultValue="activelearning"
        />
        <label className="tab-label" htmlFor={this.tabId}>
          Active Learning
        </label>
        <div className="tab-content">
          <table style={{ fontSize: 'smaller', width: '100%' }}>
            <tbody>
              <tr>
                <td>
                  <button
                    className="actionInput"
                    style={{ backgroundColor: 'lightgray' }}
                    onClick={this.onClickNextSample}
                  >
                    Next Sample
                  </button>
                </td>
                <td>&nbsp;</td>
                <td>
                  <button
                    className="actionInput"
                    style={{ backgroundColor: 'lightgray' }}
                    onClick={this.onClickUpdateModel}
                  >
                    {this.state.training ? 'Stop Training' : 'Update Model'}
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
          <br />

          <table className="optionsTable">
            <tbody>
              <tr>
                <td>Strategy:</td>
                <td width="80%">
                  <select
                    className="actionInput"
                    onChange={this.onChangeStrategy}
                    defaultValue={this.state.strategy}
                  >
                    {Object.keys(strategies).map((a) => (
                      <option key={a} name={a} value={a}>
                        {a}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
              <tr>
                <td colSpan="2">&nbsp;</td>
              </tr>
              <tr>
                <td>Annotated:</td>
                <td width="80%" title={activelearningTip}>
                  <div className="w3-round w3-light-grey w3-tiny">
                    <div
                      className="w3-round w3-container w3-blue w3-center"
                      style={{ backgroundColor: 'white' }}
                    >
                      {activelearning}
                    </div>
                  </div>
                </td>
              </tr>
              <tr>
                <td>Training:</td>
                <td title={trainingTip}>
                  <div className="w3-round w3-light-grey w3-tiny">
                    <div
                      className="w3-round w3-container w3-orange w3-center"
                      style={{ backgroundColor: 'white' }}
                    >
                      {training}
                    </div>
                  </div>
                </td>
              </tr>
              <tr>
                <td>Train Acc:</td>
                <td title={accuracyTip}>
                  <div className="w3-round w3-light-grey w3-tiny">
                    <div
                      className="w3-round w3-container w3-green w3-center"
                      style={{ backgroundColor: 'white' }}
                    >
                      {accuracy}
                    </div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  }
}

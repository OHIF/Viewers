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
import ModelSelector from '../ModelSelector';
import BaseTab from './BaseTab';
import { hideNotification } from '../../utils/GenericUtils';

export default class AutoSegmentation extends BaseTab {
  modelSelector: any;

  constructor(props) {
    super(props);

    this.modelSelector = React.createRef();
    this.state = {
      currentModel: null,
    };
  }

  onSelectModel = (model) => {
    console.log('Selecting  Auto Segmentation Model...');
    console.log(model);
    this.setState({ currentModel: model });
  };

  getModels() {
    const { info } = this.props;
    const models = Object.keys(info.data.models).filter(
      (m) =>
        info.data.models[m].type === 'segmentation' ||
        info.data.models[m].type === 'vista3d'
    );
    return models;
  }

  onSegmentation = async () => {
    const { currentModel, currentLabel, clickPoints } = this.state;
    const { info } = this.props;
    const { displaySet } = this.props.getActiveViewportInfo();

    const models = this.getModels();
    let selectedModel = 0;
    for (const model of models) {
      if (!currentModel || model === currentModel) {
        break;
      }
      selectedModel++;
    }

    const model = models.length > 0 ? models[selectedModel] : null;
    if (!model) {
      this.notification.show({
        title: 'MONAI Label',
        message: 'Something went wrong: Model is not selected',
        type: 'error',
        duration: 10000,
      });
      return;
    }

    const nid = this.notification.show({
      title: 'MONAI Label - ' + model,
      message: 'Running Auto-Segmentation...',
      type: 'info',
      duration: 7000,
    });

    const config = this.props.onOptionsConfig();
    const params =
      config && config.infer && config.infer[model] ? config.infer[model] : {};
    const label_names = info.modelLabelNames[model];
    const label_classes = info.modelLabelIndices[model];
    if (info.data.models[model].type === 'vista3d') {
      const bodyComponents = [
        'kidney',
        'lung',
        'bone',
        'lung tumor',
        'uterus',
        'postcava',
      ];
      const exclusionValues = bodyComponents.map(
        (cls_name) => info.modelLabelToIdxMap[model][cls_name]
      );
      const filteredLabelClasses = label_classes.filter(
        (value) => !exclusionValues.includes(value)
      );
      params['label_prompt'] = filteredLabelClasses;
    }

    const response = await this.props
      .client()
      .infer(model, displaySet.SeriesInstanceUID, params);
    // console.log(response);

    hideNotification(nid, this.notification);
    if (response.status !== 200) {
      this.notification.show({
        title: 'MONAI Label - ' + model,
        message: 'Failed to Run Segmentation',
        type: 'error',
        duration: 6000,
      });
      return;
    }

    this.notification.show({
      title: 'MONAI Label - ' + model,
      message: 'Running Segmentation - Successful',
      type: 'success',
      duration: 4000,
    });

    this.props.updateView(response, model, label_names);
  };

  render() {
    const models = this.getModels();
    return (
      <div className="tab">
        <input
          type="radio"
          name="rd"
          id={this.tabId}
          className="tab-switch"
          defaultValue="segmentation"
          onClick={this.onSelectActionTab}
          defaultChecked
        />
        <label htmlFor={this.tabId} className="tab-label">
          Auto-Segmentation
        </label>
        <div className="tab-content">
          <ModelSelector
            ref={this.modelSelector}
            name="segmentation"
            title="Segmentation"
            models={models}
            currentModel={this.state.currentModel}
            onClick={this.onSegmentation}
            onSelectModel={this.onSelectModel}
            usage={
              <div style={{ fontSize: 'smaller' }}>
                <br />
                <p>
                  Experience fully automated segmentation for <b>everything</b>{' '}
                  from the pre-trained model.
                </p>
              </div>
            }
          />
        </div>
      </div>
    );
  }
}

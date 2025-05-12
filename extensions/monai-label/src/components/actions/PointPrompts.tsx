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
import './PointPrompts.css';
import ModelSelector from '../ModelSelector';
import BaseTab from './BaseTab';
import * as cornerstoneTools from '@cornerstonejs/tools';
import { hideNotification } from '../../utils/GenericUtils';
import { cache } from '@cornerstonejs/core';

export default class PointPrompts extends BaseTab {
  modelSelector: any;

  constructor(props) {
    super(props);

    this.modelSelector = React.createRef();
    this.state = {
      currentModel: null,
      currentLabel: null,
      clickPoints: new Map(),
      availableOrgans: {},
    };
  }

  onSelectModel = (model) => {
    // console.log('Selecting  (Point) Interaction Model...');
    const currentLabel = null;
    const clickPoints = new Map();
    this.setState({
      currentModel: model,
      currentLabel: currentLabel,
      clickPoints: clickPoints,
      availableOrgans: this.getModelLabels(model),
    });

    this.clearAllPoints();
  };

  onEnterActionTab = () => {
    this.props.commandsManager.runCommand('setToolActive', {
      toolName: 'ProbeMONAILabel',
    });
    // console.info('Here we activate the probe');
  };

  onLeaveActionTab = () => {
    this.onChangeLabel(null);
    this.props.commandsManager.runCommand('setToolDisable', {
      toolName: 'ProbeMONAILabel',
    });
    // console.info('Here we deactivate the probe');
  };

  onRunInference = async () => {
    const { currentModel, currentLabel, clickPoints } = this.state;
    const { info } = this.props;
    const { viewport, displaySet } = this.props.getActiveViewportInfo();

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
      message: 'Running Point Based Inference...',
      type: 'info',
      duration: 4000,
    });

    const { cornerstoneViewportService } = this.props.servicesManager.services;
    const viewportInfo = cornerstoneViewportService.getViewportInfo(
      viewport.viewportId
    );
    const { worldToIndex } = viewportInfo.viewportData.data[0].volume.imageData;

    const manager = cornerstoneTools.annotation.state.getAnnotationManager();
    clickPoints[currentLabel] = manager.saveAnnotations(
      null,
      'ProbeMONAILabel'
    );

    const points = {};
    let label_names = [];
    for (const label in clickPoints) {
      // console.log(clickPoints[label]);
      for (const uid in clickPoints[label]) {
        const annotations = clickPoints[label][uid]['ProbeMONAILabel'];
        // console.log(annotations);
        points[label] = [];
        for (const annotation of annotations) {
          const pt = annotation.data.handles.points[0];
          points[label].push(worldToIndex(pt).map(Math.round));
        }
      }
      label_names.push(label);
    }

    const config = this.props.onOptionsConfig();
    const params =
      config && config.infer && config.infer[model] ? config.infer[model] : {};
    let sidx = -1;
    if (info.data.models[model].type === 'vista3d') {
      params['points'] = points[currentLabel];
      params['point_labels'] = new Array(params['points'].length).fill(1);
      if (points['background'] && points['background'].length > 0) {
        for (let i = 0; i < points['background'].length; i++) {
          params['point_labels'].push(0);
        }
        params['points'] = params['points'].concat(points['background']);
      }

      params['label_prompt'] = [info.modelLabelToIdxMap[model][currentLabel]];
      label_names = [currentLabel];
    } else if (info.data.models[model].type === 'deepedit') {
      params['background'] = [];
      for (const label in points) {
        params[label] = points[label];
      }
    } else {
      let bg =
        points['background'] && points['background'].length
          ? points['background']
          : [];
      let fg = points[currentLabel];
      if (info.data.models[model].dimension === 2) {
        sidx = fg.length
          ? fg[fg.length - 1][2]
          : bg.length
            ? bg[bg.length - 1][2]
            : -1;
        fg = fg.filter((p) => p[2] === sidx);
        bg = bg.filter((p) => p[2] === sidx);
      }
      params['foreground'] = fg;
      params['background'] = bg;
      label_names = [currentLabel];
    }

    const response = await this.props
      .client()
      .infer(model, displaySet.SeriesInstanceUID, params);
    // console.log(response);

    hideNotification(nid, this.notification);
    if (response.status !== 200) {
      this.notification.show({
        title: 'MONAI Label - ' + model,
        message: 'Failed to Run Inference for Point Prompts',
        type: 'error',
        duration: 6000,
      });
      return;
    }

    this.notification.show({
      title: 'MONAI Label - ' + model,
      message: 'Running Inference for Point Prompts - Successful',
      type: 'success',
      duration: 4000,
    });

    const label_class_unknown = info.data.models[model].type === 'deepgrow';
    console.log('Target Labels to update: ', label_names, label_class_unknown);
    this.props.updateView(
      response,
      model,
      label_names,
      true,
      label_class_unknown,
      sidx
    );
  };

  initPoints = () => {
    const label = this.state.currentLabel;
    if (!label) {
      console.log('Current Label is Null (No need to init)');
      return;
    }

    const { toolGroupService, viewportGridService } =
      this.props.servicesManager.services;
    const { viewports, activeViewportId } = viewportGridService.getState();
    const viewport = viewports.get(activeViewportId);
    const { viewportOptions } = viewport;
    const toolGroupId = viewportOptions.toolGroupId;

    const colorMap = this.segmentInfo();
    const customColor = this.segColorToRgb(colorMap[label]);
    toolGroupService.setToolConfiguration(toolGroupId, 'ProbeMONAILabel', {
      customColor: customColor,
    });

    const annotations = this.state.clickPoints[label];
    if (annotations) {
      const manager = cornerstoneTools.annotation.state.getAnnotationManager();
      manager.restoreAnnotations(annotations, null, 'ProbeMONAILabel');
    }
  };

  clearPoints = () => {
    cornerstoneTools.annotation.state
      .getAnnotationManager()
      .removeAllAnnotations();
    this.props.servicesManager.services.cornerstoneViewportService
      .getRenderingEngine()
      .render();
  };

  clearAllPoints = () => {
    const clickPoints = new Map();
    this.setState({ clickPoints: clickPoints });
    this.clearPoints();
  };

  segColorToRgb(s) {
    const c = s ? s.color : [0, 0, 0];
    return `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
  }

  onChangeLabel = (name) => {
    console.log(name, this.state.currentLabel);
    if (name === this.state.currentLabel) {
      console.log('Both new and prev are same');
      return;
    }

    const prev = this.state.currentLabel;
    const clickPoints = this.state.clickPoints;
    if (prev) {
      const manager = cornerstoneTools.annotation.state.getAnnotationManager();
      const annotations = manager.saveAnnotations(null, 'ProbeMONAILabel');
      console.log('Saving Prev annotations...', annotations);

      this.state.clickPoints[prev] = annotations;
      this.clearPoints();
    }

    this.state.currentLabel = name;
    this.setState({ currentLabel: name, clickPoints: clickPoints });
    this.initPoints();
  };

  getModels() {
    const { info } = this.props;
    const models = Object.keys(info.data.models).filter(
      (m) =>
        info.data.models[m].type === 'deepgrow' ||
        info.data.models[m].type === 'deepedit' ||
        info.data.models[m].type === 'vista3d'
    );
    return models;
  }

  getModelLabels(model) {
    const { info } = this.props;
    if (model && info.modelLabelNames[model].length) {
      return info.modelLabelNames[model];
    }
    return info.labels;
  }

  getSelectedModel() {
    let selectedModel = 0;
    const models = this.getModels();
    for (const model of models) {
      if (!this.state.currentModel || model === this.state.currentModel) {
        break;
      }
      selectedModel++;
    }
    const model = models.length > 0 ? models[selectedModel] : null;
    // console.log('Selected Model: ', model);
    if (!model) {
      console.log('Something went error..');
      return null;
    }
    return model;
  }

  render() {
    const models = this.getModels();
    const display = models.length > 0 ? 'block' : 'none';
    const segInfo = this.segmentInfo();
    const labels = this.getModelLabels(this.getSelectedModel());

    return (
      <div className="tab" style={{ display: display }}>
        <input
          type="radio"
          name="rd"
          id={this.tabId}
          className="tab-switch"
          defaultValue="pointprompts"
          onClick={this.onSelectActionTab}
        />
        <label htmlFor={this.tabId} className="tab-label">
          Point Prompts
        </label>
        <div className="tab-content">
          <ModelSelector
            ref={this.modelSelector}
            name="pointprompts"
            title="PointPrompts"
            models={models}
            currentModel={this.state.currentModel}
            onClick={this.onRunInference}
            onSelectModel={this.onSelectModel}
            usage={
              <div style={{ fontSize: 'smaller' }}>
                {/*<p>*/}
                {/*  <input id="autorun" type="checkbox" />&nbsp;*/}
                {/*  <span style={{ color: 'green' }}>Auto Run</span> on every*/}
                {/*  click*/}
                {/*</p>*/}
                <br />
                <p>Select an anatomy from the segments menu below.</p>
                <p>To guide the inference, add foreground clicks:</p>
                <u>
                  <a
                    style={{ color: 'red', cursor: 'pointer' }}
                    onClick={() => this.clearPoints()}
                  >
                    Clear Points
                  </a>
                </u>{' '}
                |{' '}
                <u>
                  <a
                    style={{ color: 'red', cursor: 'pointer' }}
                    onClick={() => this.clearAllPoints()}
                  >
                    Clear All Points
                  </a>
                </u>
              </div>
            }
          />
          <div className="optionsTableContainer">
            <hr />
            <p>Available Organ(s):</p>
            <hr />
            <div className="bodyTableContainer">
              <table className="optionsTable">
                <tbody>
                  <tr
                    key="background"
                    className="clickable-row"
                    style={{
                      backgroundColor:
                        this.state.currentLabel === 'background'
                          ? 'darkred'
                          : 'transparent',
                    }}
                    onClick={() => this.onChangeLabel('background')}
                  >
                    <td>
                      {/* Content for the "background" entry */}
                      <span
                        className="segColor"
                        style={{
                          backgroundColor: this.segColorToRgb(
                            segInfo['background']
                          ),
                        }}
                      />
                    </td>
                    <td>background</td>
                  </tr>
                  {labels
                    .filter((l) => l !== 'background')
                    .map((label) => (
                      <tr
                        key={label}
                        className="clickable-row"
                        style={{
                          backgroundColor:
                            this.state.currentLabel === label
                              ? 'darkblue'
                              : 'transparent',
                          cursor: 'pointer',
                        }}
                        onClick={() => this.onChangeLabel(label)}
                      >
                        <td>
                          <span
                            className="segColor"
                            style={{
                              backgroundColor: this.segColorToRgb(
                                segInfo[label]
                              ),
                            }}
                          />
                        </td>
                        <td>{label}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

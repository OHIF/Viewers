import React from 'react';
import PropTypes from 'prop-types';
import csTools from 'cornerstone-tools';
import { AIAA_TOOL_TYPES, AIAA_MODEL_TYPES } from '../../aiaa-tools';
import showNotification from '../common/showNotification.js';

import '../XNATRoiPanel.styl';

const modules = csTools.store.modules;

export default class AIAAToolkit extends React.Component {
  static propTypes = {
    serverUrl: PropTypes.string,
    models: PropTypes.array,
    onToolUpdate: PropTypes.func,
    onClearPoints: PropTypes.func,
    onRunModel: PropTypes.func,
  }

  static defaultProps = {
    serverUrl: undefined,
    models: [],
    onToolUpdate: undefined,
    onClearPoints: undefined,
    onRunModel: undefined,
  }

  constructor(props = {}) {
    super(props);

    this._aiaaClient = modules.aiaa.client;

    this.state = {
      currentTool: this._aiaaClient.currentTool,
      currentModel: this._aiaaClient.currentModel,
    };

    this.onAiaaToolChange = this.onAiaaToolChange.bind(this);
    this.filterModelsForCurrentTool = this.filterModelsForCurrentTool.bind(this);
    this.onAiaaModelChange = this.onAiaaModelChange.bind(this);
  }

  onAiaaToolChange = evt => {
    const value = evt.target.value;
    this._aiaaClient.currentTool = AIAA_TOOL_TYPES[value];
    this.setState({ currentTool: this._aiaaClient.currentTool });

    this.props.onToolUpdate();
  }

  onAiaaModelChange = evt => {
    const { models } = this.props;
    const value = evt.target.value;
    this._aiaaClient.currentModel = models.filter(model => {
      return model.name === value;
    })[0];

    this.setState({ currentModel: this._aiaaClient.currentModel });
  }

  filterModelsForCurrentTool = () => {
    const { currentTool } = this.state;
    const { models } = this.props;
    const toolModels = models.filter(model => {
      return model.type === currentTool.type;
    });

    if (toolModels === undefined || toolModels.length === 0) {
      this._aiaaClient.currentModel = null;
      return (
        <div className="footerSectionItem" style={{ marginTop: 0 }}>
          <p style={{ color: 'var(--snackbar-error)' }}>
            AIAA server has no available models for this tool.
          </p>
        </div>
      );
    }

    if (this._aiaaClient.currentModel === null) {
      this._aiaaClient.currentModel = toolModels[0];
    } else {
      let modelIndex = toolModels.findIndex(model => {
        return this._aiaaClient.currentModel.name === model.name;
      });
      if (modelIndex < 0) {
        modelIndex = 0;
      }
      this._aiaaClient.currentModel = toolModels[modelIndex];
    }

    return (
      <React.Fragment>
        <div className="footerSectionItem"
             style={{ marginTop: 0 }}>
          <label>{`${currentTool.name} models`}</label>
          <select
            onChange={this.onAiaaModelChange}
            defaultValue={this._aiaaClient.currentModel.name}
          >
            {toolModels.map((model, key) => (
              <option key={key} value={model.name}>
                {model.name}
              </option>
            ))}
          </select>
          {currentTool.type === AIAA_MODEL_TYPES.SEGMENTATION &&
            <button
              style={{ marginLeft: 5 }}
              onClick={() => this.props.onRunModel()}
            >
              Run
            </button>
          }
        </div>
        <div className="footerSectionItem" style={{ marginTop: 0}}>
          <p>{this._aiaaClient.currentModel.description}</p>
        </div>
        {currentTool.type !== AIAA_MODEL_TYPES.SEGMENTATION &&
          <div
            className="footerSectionItem"
            style={{ marginTop: 0, marginBottom: 10 }}
          >
            <button
              style={{ marginLeft: 'auto' }}
              onClick={() => this.props.onClearPoints(false)}
            >
              Clear segment points
            </button>
            <button
              style={{ marginLeft: 5 }}
              onClick={this.props.onClearPoints}
            >
              Clear all points
            </button>
          </div>
        }
      </React.Fragment>
    );
  }

  render() {
    const { serverUrl } = this.props;
    const { currentTool } = this.state;
    let currentToolIndex = AIAA_TOOL_TYPES.findIndex(tool => {
      return tool.type === currentTool.type;
    });
    if (currentToolIndex < 0) {
      currentToolIndex = 0;
    }

    const toolSection =
      this.filterModelsForCurrentTool();

    return (
      <React.Fragment>
        <div className="footerSection" style={{ marginBottom: 5 }}>
          Server URL: {serverUrl}
        </div>
        <div className="footerSection" style={{ marginBottom: 5 }}>
          <div className="footerSectionItem">
            <label htmlFor="aiaaToolList">AIAA Tool</label>
            <select
              id="aiaaToolList"
              onChange={this.onAiaaToolChange}
              defaultValue={currentToolIndex}
            >
              {AIAA_TOOL_TYPES.map((tool, key) => (
                <option key={key} value={key}>
                  {tool.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="footerSection" style={{
          border: '2px solid var(--ui-border-color)',
        }}>
          <div className="footerSectionItem" style={{ marginTop: 0 }}>
            <p>{currentTool.desc}</p>
          </div>
          {toolSection}
        </div>

        <div className="footerSection"/>
      </React.Fragment>
    );
  }
}

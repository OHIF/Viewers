import React from 'react';
import PropTypes from 'prop-types';
import cornerstone from 'cornerstone-core';
import csTools from 'cornerstone-tools';
import { Icon } from '@ohif/ui';
import AIAAMenuSettings from './AIAAMenuSettings';
import AIAAToolkit from './AIAAToolkit';
import showNotification from '../common/showNotification';
import { showStatusModal, updateStatusModal } from '../common/statusModal.js';
import { AIAA_TOOL_TYPES, AIAA_MODEL_TYPES } from '../../aiaa-tools';
import refreshViewports from '../../utils/refreshViewports.js';
import { removeEmptyLabelmaps2D } from '../../peppermint-tools';
import isValidUrl from '../../utils/isValidUrl.js';
import sessionMap from '../../utils/sessionMap';

import '../XNATRoiPanel.styl';

const modules = csTools.store.modules;
const segmentationModule = csTools.getModule('segmentation');
const LOCAL_TEST = false;

export default class AIAAMenu extends React.Component {
  static propTypes = {
    studies: PropTypes.any,
    viewports: PropTypes.any,
    activeIndex: PropTypes.any,
    firstImageId: PropTypes.any,
    segmentsData: PropTypes.object,
    onNewSegment: PropTypes.func,
    featureStore: PropTypes.object,
    onUpdateFeatureStore: PropTypes.func,
  }

  static defaultProps = {
    studies: undefined,
    viewports: undefined,
    activeIndex: undefined,
    firstImageId: undefined,
    segmentsData: undefined,
    onNewSegment: undefined,
    featureStore: undefined,
    onUpdateFeatureStore: undefined,
  }

  constructor(props = {}) {
    super(props);

    const { settings } = props.featureStore;
    this._aiaaModule = modules.aiaa;
    this._aiaaClient = this._aiaaModule.client;
    // this._aiaaClient.api.setServerURL(settings.serverUrl);

    this._serverUrl = '';
    const { site, project } = sessionMap.getAiaaSettings().serverUrl;
    if (project.length !== 0) {
      this._serverUrl = project;
    } else if (site.length !== 0) {
      this._serverUrl = site;
    }
    this._aiaaClient.api.setServerURL(this._serverUrl);

    const { viewports, studies, activeIndex } = props;
    this._viewParameters =
      this.getViewParameters(viewports, studies, activeIndex);

    this.state = {
      showSettings: false,
      models: this._aiaaClient.models,
      api: {
        isConnected: this._aiaaClient.isConnected,
        isConnecting: !this._aiaaClient.isConnected,
      },
    };

    this.onToggleShowSettings = this.onToggleShowSettings.bind(this);
    this.onSaveSettings = this.onSaveSettings.bind(this);
    this.onGetModels = this.onGetModels.bind(this);
    this.onToolUpdate = this.onToolUpdate.bind(this);
    this.onRunModel = this.onRunModel.bind(this);
    this.aiaaProbToolEventListenerHandler =
      this.aiaaProbToolEventListenerHandler.bind(this);
    this.onClearPoints = this.onClearPoints.bind(this);
  }

  componentDidMount() {
    this._aiaaModule.state.menuIsOpen = true;
    if (!this._aiaaClient.isConnected) {
      this.onGetModels();
    }
  }

  componentDidUpdate(prevProps) {
    if (this.props.firstImageId !== prevProps.firstImageId) {
      const { viewports, studies, activeIndex } = this.props;
      this._viewParameters =
        this.getViewParameters(viewports, studies, activeIndex);
    }
  }

  componentWillUnmount() {
    this._aiaaModule.state.menuIsOpen = false;
  }

  setToolActive(element) {
    csTools.setToolActiveForElement(
      element, 'AIAAProbeTool', { mouseButtonMask: 1 });
    element.addEventListener(
      'nvidiaaiaaprobeevent',
      this.aiaaProbToolEventListenerHandler
    );
  }

  setToolDisabled(element) {
    element.removeEventListener(
      'nvidiaaiaaprobeevent',
      this.aiaaProbToolEventListenerHandler
    );
    csTools.setToolDisabledForElement(element, 'AIAAProbeTool', {});
  }

  async aiaaProbToolEventListenerHandler(evt) {
    const { z, segmentUid, toolType } = evt.detail;
    let segmentPoints = this._aiaaModule.getters.segmentPoints(
      segmentUid, toolType
    );

    if (toolType === AIAA_MODEL_TYPES.ANNOTATION) {
      const minPoints = this._aiaaModule.configuration.annotationMinPoints;
      if (segmentPoints.fg.length === 1) {
        showNotification(
          `The Annotation tool requires >= ${minPoints} points to run`,
          'warning',
          'NVIDIA AIAA'
        );
        return;
      } else if (segmentPoints.fg.length < minPoints) {
        return;
      }
    }

    if (toolType === AIAA_MODEL_TYPES.DEEPGROW) {
      const deepgrowModel = this._aiaaClient.currentModel;
      if (!deepgrowModel.is3D) {
        segmentPoints.fg = segmentPoints.fg.filter(p => {
          return p[2] === z;
        });
        segmentPoints.bg = segmentPoints.bg.filter(p => {
          return p[2] === z;
        });
      }
    }

    this.onRunModel(segmentPoints);
  }

  getViewParameters(viewports, studies, activeIndex) {
    const viewport = viewports[activeIndex];

    const {
      StudyInstanceUID,
      SeriesInstanceUID,
      displaySetInstanceUID,
    } = viewport;

    const element = cornerstone.getEnabledElements()[activeIndex].element;

    return {
      StudyInstanceUID,
      SeriesInstanceUID,
      displaySetInstanceUID,
      element,
    };
  }

  onToggleShowSettings = () => {
    this.setState({
      showSettings: !this.state.showSettings,
    });
  }

  onSaveSettings = newSettings => {
    this.onToggleShowSettings();

    const { featureStore, onUpdateFeatureStore } = this.props;
    if(featureStore.settings.serverUrl !== newSettings.serverUrl) {
      this._aiaaClient.api.setServerURL(newSettings.serverUrl);
      this.onGetModels();
    }

    if (!_.isEqual(newSettings, featureStore.settings)) {
      // update feature store
      onUpdateFeatureStore({
        ...featureStore,
        settings: {
          ...featureStore.settings,
          ...newSettings,
        }
      });
    }
  }

  onClearPoints(all = true) {
    const toolType = this._aiaaClient.currentTool.type;
    const { element } = this._viewParameters;
    const { segments, activeSegmentIndex } = this.props.segmentsData;

    let imageIdsPoints;
    if (!all) {
      const segIndex = segments.findIndex(seg => {
        return seg.index === activeSegmentIndex;
      });
      if (segIndex < 0) {
        return;
      }
      const segmentUid = segments[segIndex].metadata.uid;
      imageIdsPoints = this._aiaaModule.setters.removePointsForSegment(
        segmentUid, toolType
      );
    } else {
      // Remove tool points for all segments
      let segmentUids = [];
      segments.forEach(seg => {
        segmentUids.push(seg.metadata.uid);
      });
      if (segmentUids.length === 0) {
        return;
      }
      imageIdsPoints = this._aiaaModule.setters.removePointsForAllSegments(
        segmentUids, toolType
      );
    }

    if (_.isEmpty(imageIdsPoints)) {
      return;
    }

    const enabledElement = cornerstone.getEnabledElement(element);
    const currentImageId = enabledElement.image.imageId;
    Object.keys(imageIdsPoints).forEach(id => {
      enabledElement.image.imageId = id;
      const toolData = csTools.getToolState(enabledElement.element, 'AIAAProbeTool');
      if (!toolData) {
        return;
      }
      const pointUuids = imageIdsPoints[id];
      toolData.data = toolData.data.filter(data => {
        return pointUuids.indexOf(data.uuid) === -1;
      });
    });
    enabledElement.image.imageId = currentImageId;

    refreshViewports();
  }

  onGetModels = async () => {
    if (!isValidUrl(this._aiaaClient.api.getServerURL())) {
      return;
    }

    const modal = showStatusModal('Collecting model list from AIAA server...');
    this.setState({
      models: [],
      api: {
        isConnected: false,
        isConnecting: true,
      }
    });

    const { element } = this._viewParameters;
    this.setToolDisabled(element);

    if (LOCAL_TEST) {
      await this._aiaaClient.getTestModels();
    } else {
      await this._aiaaClient.getModels();
    }
    this.setState({
      models: this._aiaaClient.models,
      api: {
        isConnected: this._aiaaClient.isConnected,
        isConnecting: false,
      }
    });

    if (this._aiaaClient.isConnected) {
      this.setToolActive(element);
    }

    modal.close();
  }

  onToolUpdate = async () => {
    refreshViewports();
  }

  onRunModel = async (segmentPoints = {}) => {
    const modal = showStatusModal();

    const { element } = this._viewParameters;
    const imageIds = _getImageIdsForElement(element);
    const enabledElement = cornerstone.getEnabledElement(element);
    const refImage = enabledElement.image;
    const refImageSize = {
      width: refImage.width,
      height: refImage.height,
      numberOfFrames: imageIds.length,
    };

    let maskImage;
    if (LOCAL_TEST) {
      maskImage = await this._aiaaClient.readTestFile(imageIds);
    } else {
      const parameters = {
        SeriesInstanceUID: this._viewParameters.SeriesInstanceUID,
        imageIds,
        segmentPoints: segmentPoints,
      };

      maskImage = await this._aiaaClient.runModel(parameters, updateStatusModal);
    }

    if (!maskImage || !maskImage.data) {
      modal.close();
      showNotification(
        'Error in parsing the mask image',
        'error',
        'NVIDIA AIAA'
      );
      return;
    }

    const maskImageSize = maskImage.size;
    console.log(`Mask image size = 
                ${maskImageSize.width}, 
                ${maskImageSize.height}, 
                ${maskImageSize.numberOfFrames}`);

    if(!_.isEqual(refImageSize, maskImageSize)) {
      modal.close();
      showNotification(
        'Error: Size mismatch between the mask and reference images',
        'error',
        'NVIDIA AIAA'
      );
      return;
    }

    // const { segmentsData } = this.props;
    // let activeIndex = segmentsData.activeSegmentIndex;
    let activeIndex;
    if (this._aiaaClient.currentTool.type === AIAA_MODEL_TYPES.SEGMENTATION) {
      const labels = this._aiaaClient.currentModel.labels;
      let indexes = [];
      for (let l = 0; l < labels.length; l++) {
        indexes.push(
          this.props.onNewSegment(
            `AIAA - ${labels[l]}`)
        );
      }
      activeIndex = indexes[0];
    } else {
      const labelmap3D = segmentationModule.getters.labelmap3D(
        this._viewParameters.element, 0
      );
      const { activeSegmentIndex } = labelmap3D;
      activeIndex = activeSegmentIndex;
    }

    this.updateLabelmap(
      maskImage.data,
      maskImage.size,
      activeIndex,
      segmentPoints);

    modal.close();
  }

  updateLabelmap(image, size, activeIndex, segmentPoints) {
    /*
                            updateView      slice
    seg / ann               null            null
    seg/ann & !multi_label  overlap
    deepgrow                override        sliceIndex
    * */
    let updateType = undefined;
    const segmentOffset = activeIndex - 1;

    const { firstImageId } = this.props;

    const { state } = segmentationModule;
    const brushStackState = state.series[firstImageId];

    let labelmap3D = null;

    if (brushStackState) {
      const { activeLabelmapIndex } = brushStackState;
      labelmap3D = brushStackState.labelmaps3D[activeLabelmapIndex];
    }

    if (labelmap3D === null) {
      return;
    }

    const slicelengthInBytes = image.byteLength / size.numberOfFrames;
    const sliceLength = size.width * size.height; //slicelengthInBytes / 2; //UInt16
    const bytesPerVoxel = slicelengthInBytes / sliceLength;

    if (bytesPerVoxel !== 1 && bytesPerVoxel !== 2) {
      console.error(
        `No method for parsing ArrayBuffer to ${bytesPerVoxel}-byte array`
      );
      return;
    }

    const typedArray = bytesPerVoxel === 1 ? Uint8Array : Uint16Array;

    const updateSlice = (s, override = false) => {
      const sliceOffset = slicelengthInBytes * s;
      const imageData = new typedArray(image, sliceOffset, sliceLength);

      const imageHasData = imageData.some(pixel => pixel !== 0);
      if (!imageHasData) {
        return;
      }

      const labelmap = segmentationModule.getters.labelmap2DByImageIdIndex(
        labelmap3D, s, size.height, size.width
      );

      let labelmapData = labelmap.pixelData;

      for (let j = 0; j < imageData.length; j++) {
        if (imageData[j] > 0) {
          labelmapData[j] = imageData[j] + segmentOffset;
        } else if (override && labelmapData[j] === activeIndex) {
          labelmapData[j] = 0;
        }
      }

      segmentationModule.setters.updateSegmentsOnLabelmap2D(labelmap);
    };

    const isDeepgrow =
      this._aiaaClient.currentTool.type === AIAA_MODEL_TYPES.DEEPGROW;

    if (isDeepgrow && !this._aiaaClient.currentModel.is3D) {
      let sliceIndex;
      if (segmentPoints.fg.length > 0) {
        sliceIndex = segmentPoints.fg[0][2];
      } else if (segmentPoints.bg.length > 0) {
        sliceIndex = segmentPoints.fg[0][2];
      }
      updateSlice(sliceIndex, true);
    } else {
      for (let s = 0; s < size.numberOfFrames; s++) {
        updateSlice(s, isDeepgrow);
      }
    }

    removeEmptyLabelmaps2D(labelmap3D);

    refreshViewports();
  }

  render() {
    const { featureStore } = this.props;
    const { settings } = featureStore;
    const { showSettings, api, models } = this.state;

    const serverUrl = this._serverUrl;

    let statusMessage = null;
    // if (settings.serverUrl.length === 0) {
    if (serverUrl.length === 0) {
      statusMessage =
        <p style={{ color: 'var(--snackbar-error)' }}>
          To use AIAA tools, please ask a site admin to add server URL
        </p>
    } else if (api.isConnecting) {
      statusMessage =
        <p>{`Connecting to ${serverUrl} ...`}</p>
    } else if (!api.isConnected) {
      statusMessage =
        <p style={{ color: 'var(--snackbar-error)' }}>
          {`Error connecting to ${serverUrl}`}
        </p>
    }

    return (
      <div className="roiPanelFooter">
        <div className="title-with-icon">
          <h4>NVIDIA AI-Assisted Annotation
            {showSettings &&
            <>
              <span style={{ color: 'var(--active-color)' }}> | </span>
              <span style={{ fontWeight: 'normal' }}>Settings</span>
            </>
            }
          </h4>
          {/*<Icon*/}
          {/*  className="settings-icon"*/}
          {/*  name={showSettings ? 'xnat-cancel' : 'cog'}*/}
          {/*  width="15px"*/}
          {/*  height="15px"*/}
          {/*  style={{ marginTop: 5, marginLeft: 'auto' }}*/}
          {/*  onClick={this.onToggleShowSettings}*/}
          {/*/>*/}
          {/*{!showSettings &&*/}
          <Icon
            className="settings-icon"
            name="reset"
            width="15px"
            height="15px"
            style={{ marginTop: 5, marginLeft: 'auto' }}
            onClick={() => this.onGetModels()}
          />
          {/*}*/}
        </div>
        {
          // showSettings ?
          // <AIAAMenuSettings
          //   settings={settings}
          //   onSave={this.onSaveSettings}
          // /> :
          (statusMessage ?
              <div className="footerSection" style={{ marginBottom: 5 }}>
                <div className="footerSectionItem"
                     style={{ marginBottom: 10, marginTop: 0 }}>
                  {statusMessage}
                </div>
              </div>
              :
              <AIAAToolkit
                serverUrl={serverUrl}
                models={models}
                onToolUpdate={this.onToolUpdate}
                onClearPoints={this.onClearPoints}
                onRunModel={this.onRunModel}
              />
          )
        }
      </div>
    );
  }
}

function _getImageIdsForElement(element) {
  const stackToolState = csTools.getToolState(element, 'stack');
  return stackToolState.data[0].imageIds;
}

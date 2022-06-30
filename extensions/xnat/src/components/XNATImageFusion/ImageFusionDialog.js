import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import cornerstone from 'cornerstone-core';
import OHIF from '@ohif/core';
import { Icon } from '@ohif/ui';
import { isEqual, isEmpty } from 'lodash';
import {
  LayerOpacityRange,
  VTKIntensityRange,
  VTKWindowLevelRange,
  VTKOpacityRange,
} from '../../elements/rangeSliders';

import './ImageFusionDialog.styl';

const { studyMetadataManager, StackManager } = OHIF.utils;

export const DEFAULT_FUSION_DATA = {
  StudyInstanceUID: '',
  displaySetInstanceUID: 'none',
  opacity: 0.5,
  visible: true,
};

const _getModality = ({ StudyInstanceUID, displaySetInstanceUID }) => {
  if (!StudyInstanceUID || displaySetInstanceUID === 'none') {
    return;
  }

  const studyMetadata = studyMetadataManager.get(StudyInstanceUID);
  const displaySet = studyMetadata.findDisplaySet(
    displaySet => displaySet.displaySetInstanceUID === displaySetInstanceUID
  );
  if (displaySet) {
    return displaySet.Modality;
  }
};

class ImageFusionDialog extends PureComponent {
  constructor(props) {
    super(props);

    const layerList = [
      {
        displaySetInstanceUID: DEFAULT_FUSION_DATA.displaySetInstanceUID,
        SeriesDescription: 'No fusion',
      },
    ];

    this.contextColormaps = props.colormaps;

    this.prevDisplaySetInstanceUID = 'none';

    this.state = {
      layerList: layerList,
      // Composition data
      ...DEFAULT_FUSION_DATA,
      colormap: this.contextColormaps.defaultColormap,
      isLoading: false,
      vtkProperties: {},
      requiresApply: false,
    };

    this.onApplyFusion = this.onApplyFusion.bind(this);
    this.onActiveScanChange = this.onActiveScanChange.bind(this);
    this.onToggleVisibility = this.onToggleVisibility.bind(this);
    this.onColormapChanged = this.onColormapChanged.bind(this);
    this.onOpacityChanged = this.onOpacityChanged.bind(this);
    this.onIntensityRangeChanged = this.onIntensityRangeChanged.bind(this);
    this.onOpacityRangeChanged = this.onOpacityRangeChanged.bind(this);
    this.onLoadedVolumeData = this.onLoadedVolumeData.bind(this);
  }

  componentDidMount() {
    const { viewportSpecificData, isVTK } = this.props;

    const { validOverlayDisplaySets, imageFusionData } = viewportSpecificData;
    const _imageFusionData = imageFusionData || {
      ...DEFAULT_FUSION_DATA,
      colormap: this.contextColormaps.defaultColormap,
    };
    const updatedLayerList = this.getLayerList(validOverlayDisplaySets);

    const newState = { layerList: updatedLayerList, ..._imageFusionData };

    if (isVTK) {
      const vtkProperties = this.getVolumeProperties(
        _imageFusionData.displaySetInstanceUID
      );
      if (!vtkProperties) {
        newState.vtkProperties = {};
      } else {
        newState.vtkProperties = vtkProperties;
      }
    }

    this.setState(newState);
  }

  componentDidUpdate(prevProps, prevState) {
    const { viewportSpecificData, activeViewportIndex } = this.props;
    const { validOverlayDisplaySets, imageFusionData } = viewportSpecificData;
    const _imageFusionData = imageFusionData || {
      ...DEFAULT_FUSION_DATA,
      colormap: this.contextColormaps.defaultColormap,
    };

    const {
      viewportSpecificData: prevViewportSpecificData,
      activeViewportIndex: prevActiveViewportIndex,
    } = prevProps;
    const { imageFusionData: prevImageFusionData } = prevViewportSpecificData;

    this.prevDisplaySetInstanceUID = prevState.displaySetInstanceUID;

    if (activeViewportIndex !== prevActiveViewportIndex) {
      const updatedLayerList = this.getLayerList(validOverlayDisplaySets);
      this.setState({ layerList: updatedLayerList, ..._imageFusionData });
    } else if (
      !isEqual(_imageFusionData, prevImageFusionData) &&
      isEqual(prevState, this.state)
    ) {
      this.setState({ ..._imageFusionData });
    }
  }

  getVolumeProperties(displaySetInstanceUID) {
    const { commandsManager } = this.props;
    const userProperties = commandsManager.runCommand('getVolumeProperties', {
      displaySetInstanceUID,
      options: { source: 'user' },
    });

    if (userProperties) {
      return userProperties.fg;
    }
  }

  updateStore(updatedImageFusionData) {
    const { activeViewportIndex, setViewportFusionData } = this.props;

    const {
      StudyInstanceUID,
      displaySetInstanceUID,
      opacity,
      colormap,
      visible,
    } = this.state;

    const isVisible =
      updatedImageFusionData.visible !== undefined
        ? updatedImageFusionData.visible
        : visible;

    const imageFusionData = {
      displaySetInstanceUID:
        updatedImageFusionData.displaySetInstanceUID || displaySetInstanceUID,
      opacity: updatedImageFusionData.opacity || opacity,
      colormap: updatedImageFusionData.colormap || colormap,
      visible: isVisible,
      StudyInstanceUID,
      onLoadedVolumeData: updatedImageFusionData.onLoadedVolumeData,
    };

    setViewportFusionData(activeViewportIndex, imageFusionData);
  }

  getLayerList(validOverlayDisplaySets) {
    const { layerList } = this.state;

    const updatedLayerList = layerList.slice(0, 1);
    Object.keys(validOverlayDisplaySets).forEach(key => {
      const study = studyMetadataManager.get(key);
      const {
        StudyInstanceUID,
        StudyDescription,
        displaySets,
      } = study.getData();
      const validDisplayInstanceUIDs = validOverlayDisplaySets[key];
      const validDisplaySets = displaySets.filter(ds =>
        validDisplayInstanceUIDs.includes(ds.displaySetInstanceUID)
      );
      const studyLayerList = {
        StudyInstanceUID,
        StudyDescription,
        layers: [],
      };
      validDisplaySets.forEach(ds => {
        studyLayerList.layers.push({
          displaySetInstanceUID: ds.displaySetInstanceUID,
          SeriesInstanceUID: ds.SeriesInstanceUID,
          Modality: ds.Modality,
          SeriesNumber: ds.SeriesNumber,
          SeriesDescription: ds.SeriesDescription,
          StudyInstanceUID: StudyInstanceUID,
        });
      });
      updatedLayerList.push(studyLayerList);
    });

    return updatedLayerList;
  }

  onLoadedVolumeData(displaySetInstanceUID) {
    const vtkProperties = this.getVolumeProperties(displaySetInstanceUID);
    this.setState({ isLoading: false, vtkProperties: vtkProperties });
  }

  onActiveScanChange(evt) {
    const { isVTK } = this.props;
    const target = evt.target;
    const displaySetInstanceUID = target.value;
    const StudyInstanceUID = target.selectedOptions[0].dataset.studyuid;

    const newState = {
      displaySetInstanceUID,
      StudyInstanceUID,
      requiresApply: true,
    };

    if (isVTK) {
      const vtkProperties = this.getVolumeProperties(displaySetInstanceUID);
      if (!vtkProperties) {
        newState.vtkProperties = {};
      } else {
        newState.vtkProperties = vtkProperties;
      }
    }

    this.setState(newState);
  }

  async onApplyFusion() {
    const { isVTK } = this.props;
    const { displaySetInstanceUID, StudyInstanceUID } = this.state;

    const newState = {
      vtkProperties: {},
      requiresApply: false,
    };

    if (displaySetInstanceUID !== this.prevDisplaySetInstanceUID) {
      let onLoadedVolumeData;
      if (displaySetInstanceUID !== 'none') {
        // Make sure the first image is loaded
        const study = studyMetadataManager.get(StudyInstanceUID);

        const displaySet = study.displaySets.find(set => {
          return set.displaySetInstanceUID === displaySetInstanceUID;
        });

        // Get stack from Stack Manager
        const storedStack = StackManager.findOrCreateStack(study, displaySet);
        const firstImageId = storedStack.imageIds[0];
        if (!(firstImageId in cornerstone.imageCache.imageCache)) {
          await cornerstone.loadAndCacheImage(firstImageId);
        }

        if (isVTK) {
          // Has the volume loaded before?
          const vtkProperties = this.getVolumeProperties(displaySetInstanceUID);
          if (!vtkProperties) {
            onLoadedVolumeData = this.onLoadedVolumeData;
            newState.isLoading = true;
          } else {
            newState.vtkProperties = vtkProperties;
          }
        }
      }

      this.setState(newState);

      this.updateStore({ displaySetInstanceUID, onLoadedVolumeData });
    }
  }

  onToggleVisibility() {
    const { isVTK } = this.props;
    const { displaySetInstanceUID, visible } = this.state;

    const isVisible = !visible;

    if (isVTK) {
      const { commandsManager } = this.props;
      commandsManager.runCommand('updateVolumeVisibility', {
        displaySetInstanceUID,
        isVisible,
      });
    }

    this.updateStore({ visible: isVisible });
  }

  onColormapChanged(evt) {
    const { isVTK } = this.props;
    const { displaySetInstanceUID, vtkProperties } = this.state;

    const colormap = evt.target.value;

    if (isVTK) {
      const { user, opacity } = vtkProperties;
      const { commandsManager } = this.props;
      commandsManager.runCommand('updateVolumeColorAndOpacityRange', {
        displaySetInstanceUID,
        colormap,
        userRange: { ...user },
        opacity: [...opacity],
      });
    }

    this.updateStore({ colormap });
  }

  onOpacityChanged(value) {
    const opacity = parseFloat(value) / 100;

    this.updateStore({ opacity: opacity });
  }

  onIntensityRangeChanged(valueRange) {
    const { isVTK } = this.props;
    const { displaySetInstanceUID, colormap, vtkProperties } = this.state;

    if (isVTK) {
      const { commandsManager } = this.props;
      const vtkProperties = commandsManager.runCommand(
        'updateVolumeColorAndOpacityRange',
        {
          displaySetInstanceUID,
          colormap,
          userRange: { ...vtkProperties.user, ...valueRange },
          opacity: vtkProperties.opacity,
        }
      );
      const newRangeInfo = vtkProperties.vtkProperties || {};

      this.setState({ vtkProperties: newRangeInfo });
    }
  }

  onOpacityRangeChanged(valueArray) {
    const { isVTK } = this.props;
    const { displaySetInstanceUID, colormap, vtkProperties } = this.state;

    if (isVTK) {
      const { commandsManager } = this.props;
      const vtkProperties = commandsManager.runCommand(
        'updateVolumeColorAndOpacityRange',
        {
          displaySetInstanceUID,
          colormap,
          userRange: vtkProperties.user,
          opacity: valueArray,
        }
      );
      const newRangeInfo = vtkProperties.vtkProperties || {};

      this.setState({ vtkProperties: newRangeInfo });
    }
  }

  render() {
    const { onClose, isVTK, PiecewiseWidget } = this.props;
    const {
      layerList,
      displaySetInstanceUID,
      StudyInstanceUID,
      opacity,
      colormap,
      visible,
      isLoading,
      vtkProperties,
      requiresApply,
    } = this.state;

    const getLayerValue = ds => {
      return `${ds.Modality} ${
        ds.SeriesNumber ? `(Ser ${ds.SeriesNumber}) ` : ''
      } ${ds.SeriesDescription}`;
    };

    const modality = _getModality({ StudyInstanceUID, displaySetInstanceUID });

    const scanList = (
      <select value={displaySetInstanceUID} onChange={this.onActiveScanChange}>
        {layerList.map((study, studyIndex) => {
          if (!study.layers) {
            return (
              <option
                key={studyIndex}
                value={study.displaySetInstanceUID}
                data-studyuid=""
              >
                {study.SeriesDescription}
              </option>
            );
          }
          return (
            <optgroup
              key={studyIndex}
              label={
                study.StudyDescription
                  ? study.StudyDescription
                  : study.StudyInstanceUID
              }
            >
              {study.layers.map((ds, index) => {
                return (
                  <option
                    key={index}
                    value={ds.displaySetInstanceUID}
                    data-studyuid={ds.StudyInstanceUID}
                  >
                    {getLayerValue(ds)}
                  </option>
                );
              })}
            </optgroup>
          );
        })}
      </select>
    );

    let className = 'ImageFusionDialogContainer';
    if (isLoading) {
      className += ' isLoading';
    }

    return (
      <div className={className}>
        <div className="ImageFusionDialog">
          <div className="row">
            {scanList}
            <button
              className={`${requiresApply ? 'jump' : ''}`}
              onClick={this.onApplyFusion}
            >
              Apply
            </button>
            <div className="verticalLine" />
            <div className="group">
              <Icon name="xnat-colormap" width="18px" height="18px" />
              <select value={colormap} onChange={this.onColormapChanged}>
                {this.contextColormaps.colormapList.map(color => (
                  <option key={color.id} value={color.id}>
                    {color.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="group">
              <Icon
                name={visible ? 'eye' : 'eye-closed'}
                className="visibility"
                width="22px"
                height="22px"
                onClick={event => this.onToggleVisibility()}
              />
            </div>
            {!isVTK && (
              <div className="group">
                <Icon name="xnat-opacity" width="22px" height="22px" />
                <LayerOpacityRange
                  opacity={opacity}
                  onOpacityChanged={this.onOpacityChanged}
                />
              </div>
            )}
          </div>

          {isVTK && !isEmpty(vtkProperties) && (
            <div className="row">
              <div className="group">
                <Icon name="xnat-contrast-range" width="22px" height="22px" />
                <VTKWindowLevelRange
                  rangeInfo={{
                    voiRange: vtkProperties.voiRange,
                    dataRange: vtkProperties.dataRange,
                  }}
                  onIntensityRangeChanged={this.onIntensityRangeChanged}
                  modality={modality}
                />
              </div>
            </div>
          )}

          {/*{isVTK && !isEmpty(vtkProperties) && (*/}
          {/*  <PiecewiseWidget displaySetInstanceUID={displaySetInstanceUID} />*/}
          {/*)}*/}
        </div>
      </div>
    );
  }
}

ImageFusionDialog.propTypes = {
  onClose: PropTypes.func.isRequired,
  isVTK: PropTypes.bool.isRequired,
  viewportSpecificData: PropTypes.object.isRequired,
  colormaps: PropTypes.object.isRequired,
  activeViewportIndex: PropTypes.number.isRequired,
  setViewportFusionData: PropTypes.func.isRequired,
  commandsManager: PropTypes.object,
  PiecewiseWidget: PropTypes.elementType,
};

export default ImageFusionDialog;

import React from 'react';
import PropTypes from 'prop-types';
import MenuIOButtons from './common/MenuIOButtons.js';
//import SegmentationMenuDeleteConfirmation from './SegmentationMenuDeleteConfirmation.js';
import SegmentationMenuListBody from './XNATSegmentationMenu/SegmentationMenuListBody.js';
// import SegmentationMenuListHeader from './XNATSegmentationMenu/SegmentationMenuListHeader.js';
import SegmentationToolMenu from './XNATSegmentationMenu/SegmentationToolMenu.js';
import cornerstoneTools from 'cornerstone-tools';
import cornerstone from 'cornerstone-core';
import { segmentInputCallback } from './XNATSegmentationMenu/utils/segmentationMetadataIO.js';
import onIOCancel from './common/helpers/onIOCancel.js';
import { generateSegmentationMetadata } from '../peppermint-tools';
import XNATSegmentationExportMenu from './XNATSegmentationExportMenu/XNATSegmentationExportMenu';
import XNATSegmentationImportMenu from './XNATSegmentationImportMenu/XNATSegmentationImportMenu';
import XNATSegmentationSettings from './XNATSegmentationSettings/XNATSegmentationSettings';
import getElementFromFirstImageId from '../utils/getElementFromFirstImageId';
import { utils } from '@ohif/core';
import { Icon } from '@ohif/ui';
import MaskRoiPropertyModal from './XNATSegmentationMenu/MaskRoiPropertyModal.js';
import showModal from './common/showModal.js';
import refreshViewports from '../utils/refreshViewports';

import './XNATRoiPanel.styl';

const UNSUPPORTED_EXPORT_MODALITIES = ['MG'];

const { studyMetadataManager } = utils;
const segmentationModule = cornerstoneTools.getModule('segmentation');
const segmentationState = segmentationModule.state;
const { getToolState } = cornerstoneTools;

const _getFirstImageId = ({ StudyInstanceUID, displaySetInstanceUID }) => {
  try {
    const studies = studyMetadataManager.all();
    const studyMetadata = studies.find(
      study =>
        study.getStudyInstanceUID() === StudyInstanceUID &&
        study.displaySets.some(
          ds => ds.displaySetInstanceUID === displaySetInstanceUID
        )
    );
    const displaySet = studyMetadata.findDisplaySet(
      displaySet => displaySet.displaySetInstanceUID === displaySetInstanceUID
    );
    return displaySet.images[0].getImageId();
  } catch (error) {
    console.error('Failed to retrieve firstImageId');
    return null;
  }
};

/**
 * @class XNATSegmentationPanel - Renders a menu for importing, exporting, creating
 * and renaming Segments. As well as setting configuration settings for
 * the Brush tools.
 */
export default class XNATSegmentationPanel extends React.Component {
  static propTypes = {
    isOpen: PropTypes.any,
    studies: PropTypes.any,
    viewports: PropTypes.any,
    activeIndex: PropTypes.any,
    activeTool: PropTypes.string,
    showColorSelectModal: PropTypes.func.isRequired,
    onSegmentItemClick: PropTypes.func,
  };

  static defaultProps = {
    isOpen: undefined,
    studies: undefined,
    viewports: undefined,
    activeIndex: undefined,
    activeTool: '',
    showColorSelectModal: undefined,
    onSegmentItemClick: undefined,
  };

  constructor(props = {}) {
    super(props);

    this.onSegmentChange = this.onSegmentChange.bind(this);
    this.onEditClick = this.onEditClick.bind(this);
    this.onUpdateProperty = this.onUpdateProperty.bind(this);
    this.onDeleteClick = this.onDeleteClick.bind(this);
    this.onIOComplete = this.onIOComplete.bind(this);
    this.onNewSegment = this.onNewSegment.bind(this);
    this.onIOCancel = onIOCancel.bind(this);
    this.getSegmentList = this.getSegmentList.bind(this);
    this.refreshSegmentList = this.refreshSegmentList.bind(this);
    this.cornerstoneEventListenerHandler = this.cornerstoneEventListenerHandler.bind(
      this
    );
    this.onMaskClick = this.onMaskClick.bind(this);

    const { viewports, activeIndex } = props;
    const firstImageId = _getFirstImageId(viewports[activeIndex]);

    let segments = [];
    let activeSegmentIndex = 1;
    let labelmap3D;
    const importMetadata = this.constructor._importMetadata(firstImageId);

    if (firstImageId) {
      const segmentList = this.getSegmentList(firstImageId);

      segments = segmentList.segments;
      activeSegmentIndex = segmentList.activeSegmentIndex;
      labelmap3D = segmentList.labelmap3D;
    }

    this.state = {
      importMetadata,
      segments,
      firstImageId,
      activeSegmentIndex,
      importing: false,
      exporting: false,
      showSegmentationSettings: false,
      labelmap3D,
    };

    this.addEventListeners();
  }

  componentWillUnmount() {
    this.removeEventListeners();
  }

  addEventListeners() {
    this.removeEventListeners();

    cornerstoneTools.store.state.enabledElements.forEach(enabledElement => {
      enabledElement.addEventListener(
        'peppermintautosegmentgenerationevent',
        this.cornerstoneEventListenerHandler
      );
    });
    document.addEventListener(
      'finishedmaskimportusingmodalevent',
      this.cornerstoneEventListenerHandler
    );
  }

  removeEventListeners() {
    cornerstoneTools.store.state.enabledElements.forEach(enabledElement => {
      enabledElement.removeEventListener(
        'peppermintautosegmentgenerationevent',
        this.cornerstoneEventListenerHandler
      );
    });
    document.removeEventListener(
      'finishedmaskimportusingmodalevent',
      this.cornerstoneEventListenerHandler
    );
  }

  cornerstoneEventListenerHandler() {
    this.refreshSegmentList(this.state.firstImageId);
  }

  refreshSegmentList(firstImageId) {
    let segments = [];
    let activeSegmentIndex = 1;
    let labelmap3D;
    const importMetadata = this.constructor._importMetadata(firstImageId);

    if (firstImageId) {
      const segmentList = this.getSegmentList(firstImageId);

      segments = segmentList.segments;
      activeSegmentIndex = segmentList.activeSegmentIndex;
      labelmap3D = segmentList.labelmap3D;
    }

    this.setState({
      importMetadata,
      segments,
      firstImageId,
      activeSegmentIndex,
      importing: false,
      exporting: false,
      labelmap3D,
    });
  }

  componentDidUpdate() {
    const { viewports, activeIndex } = this.props;

    if (!viewports) {
      return;
    }

    const firstImageId = _getFirstImageId(viewports[activeIndex]);

    if (firstImageId !== this.state.firstImageId) {
      this.refreshSegmentList(firstImageId);
    }
  }

  /**
   * getSegmentList - Grabs the segments from the brushStore and
   * populates state.
   *
   * @returns {null}
   */
  getSegmentList(firstImageId) {
    const segments = this.constructor._segments(firstImageId);
    const activeSegmentIndex = this._getActiveSegmentIndex(firstImageId);
    const labelmap3D = this._getLabelmap3D(firstImageId);

    return {
      segments,
      activeSegmentIndex,
      labelmap3D,
    };
  }

  _getActiveSegmentIndex(firstImageId) {
    const brushStackState = segmentationState.series[firstImageId];

    if (!brushStackState) {
      return [];
    }

    const labelmap3D =
      brushStackState.labelmaps3D[brushStackState.activeLabelmapIndex];

    if (!labelmap3D) {
      return 0;
    }

    return labelmap3D.activeSegmentIndex;
  }

  /**
   * onIOComplete - A callback executed on succesful completion of an
   * IO opperation. Recalculates the Segmentation state.
   *
   * @returns {type}  description
   */
  onIOComplete() {
    const { firstImageId } = this.state;

    const importMetadata = this.constructor._importMetadata(firstImageId);
    const segments = this.constructor._segments(firstImageId);

    const activeSegmentIndex = this._getActiveSegmentIndex(firstImageId);

    const labelmap3D = this._getLabelmap3D(firstImageId);

    this.setState({
      importMetadata,
      segments,
      activeSegmentIndex,
      labelmap3D,
      importing: false,
      exporting: false,
    });
  }

  onNewSegment(label = 'Unnamed Segment') {
    let { labelmap3D, firstImageId } = this.state;

    const newMetadata = generateSegmentationMetadata(label);

    if (labelmap3D) {
      const { metadata } = labelmap3D;
      let segmentAdded = false;

      // Start from 1, as label 0 is an empty segment.
      for (let i = 1; i < metadata.length; i++) {
        if (!metadata[i]) {
          metadata[i] = newMetadata;
          segmentAdded = true;
          labelmap3D.activeSegmentIndex = i;
          break;
        }
      }

      if (!segmentAdded) {
        metadata.push(newMetadata);
        labelmap3D.activeSegmentIndex = metadata.length - 1;
      }
    } else {
      const element = getElementFromFirstImageId(firstImageId);

      const labelmapData = segmentationModule.getters.labelmap2D(element);

      labelmap3D = labelmapData.labelmap3D;

      const { metadata } = labelmap3D;

      metadata[1] = newMetadata;
      labelmap3D.activeSegmentIndex = 1;
    }

    const segments = this.constructor._segments(firstImageId);
    const activeSegmentIndex = this._getActiveSegmentIndex(firstImageId);

    this.setState({
      segments,
      activeSegmentIndex,
      labelmap3D,
    });

    refreshViewports();

    return activeSegmentIndex;
  }

  /**
   * onSegmentChange - Callback that changes the active segment being drawn.
   *
   * @param  {Number} segmentIndex The index of the segment to set active.
   * @returns {null}
   */
  onSegmentChange(segmentIndex) {
    const { labelmap3D } = this.state;

    labelmap3D.activeSegmentIndex = segmentIndex;

    this.setState({ activeSegmentIndex: segmentIndex });

    refreshViewports();
  }

  /**
   * onEditClick - A callback that triggers metadata input for a segment.
   *
   * @param  {Number} segmentIndex The index of the segment metadata to edit.
   * @param  {object}   metadata     The current metadata of the segment.
   * @returns {null}
   */
  onEditClick(segmentIndex, metadata) {
    const onUpdateProperty = this.onUpdateProperty;
    showModal(
      MaskRoiPropertyModal,
      { metadata, segmentIndex, onUpdateProperty },
      metadata.segmentLabel
    );
  }

  /**
   * onUpdateProperty - A callback for onEditClick.
   */
  onUpdateProperty(data) {
    const { firstImageId } = this.state;
    const element = getElementFromFirstImageId(firstImageId);
    segmentInputCallback({ ...data, element });
    this.refreshSegmentList(firstImageId);
  }

  /**
   * onMaskClick - Jumps to the middle slice of a segment
   *
   * @param segmentIndex
   */
  onMaskClick(segmentIndex, frameIndex) {
    const { activeIndex, onSegmentItemClick, viewports } = this.props;

    const enabledElements = cornerstone.getEnabledElements();
    const element = enabledElements[activeIndex].element;

    const toolState = getToolState(element, 'stack');

    if (!toolState) {
      return;
    }

    const imageIds = toolState.data[0].imageIds;
    const imageId = imageIds[frameIndex];
    const SOPInstanceUID = cornerstone.metaData.get('SOPInstanceUID', imageId);
    const StudyInstanceUID = cornerstone.metaData.get('StudyInstanceUID', imageId);

    onSegmentItemClick({
      StudyInstanceUID,
      SOPInstanceUID,
      frameIndex,
      activeViewportIndex: activeIndex,
      displaySetInstanceUID: viewports[activeIndex].displaySetInstanceUID,
    });
  }

  /**
   * onDeleteClick - A callback that deletes a segment form the series.
   *
   * @returns {null}
   */
  onDeleteClick(segmentIndex) {
    //ToDo: use confirmDeleteOnDeleteClick
    const { firstImageId, activeSegmentIndex, labelmap3D } = this.state;
    const element = getElementFromFirstImageId(firstImageId);

    // Delete segment AIAA points
    if ('aiaa' in cornerstoneTools.store.modules) {
      const aiaaModule = cornerstoneTools.store.modules.aiaa;
      const segmentUid = labelmap3D.metadata[segmentIndex].uid;
      aiaaModule.setters.removeAllPointsForSegment(segmentUid);
    }

    segmentationModule.setters.deleteSegment(element, segmentIndex);

    const segments = this.constructor._segments(firstImageId);

    let newSegmentIndex = activeSegmentIndex;
    if (segmentIndex === activeSegmentIndex) {
      newSegmentIndex = 1;
      if (segments.length > 0) {
        newSegmentIndex = segments[segments.length - 1].index;
      }
      labelmap3D.activeSegmentIndex = newSegmentIndex;
    }

    this.setState({
      segments,
      activeSegmentIndex: newSegmentIndex,
    });
  }

  /**
   * _importMetadata - Returns the import metadata for the active series.
   *
   * @returns {object} The importMetadata.
   */
  static _importMetadata(firstImageId) {
    const importMetadata = segmentationModule.getters.importMetadata(
      firstImageId
    );

    if (importMetadata) {
      return {
        label: importMetadata.label,
        type: importMetadata.type,
        name: importMetadata.name,
        modified: importMetadata.modified ? 'true' : ' false',
      };
    }

    return {
      name: 'New Mask Collection',
      label: '',
    };
  }

  _getLabelmap3D(firstImageId) {
    const brushStackState = segmentationState.series[firstImageId];

    if (!brushStackState) {
      return;
    }

    return brushStackState.labelmaps3D[brushStackState.activeLabelmapIndex];
  }

  /**
   * _segments - Returns an array of segment metadata for the active series.
   *
   * @returns {object[]} An array of segment metadata.
   */
  static _segments(firstImageId) {
    const brushStackState = segmentationState.series[firstImageId];

    if (!brushStackState) {
      return [];
    }

    const labelmap3D =
      brushStackState.labelmaps3D[brushStackState.activeLabelmapIndex];

    if (!labelmap3D) {
      return [];
    }

    const metadata = labelmap3D.metadata;

    if (!metadata) {
      return [];
    }

    const segments = [];

    for (let i = 0; i < metadata.length; i++) {
      if (metadata[i]) {
        segments.push({
          index: i,
          metadata: metadata[i],
        });
      }
    }

    return segments;
  }

  render() {
    const {
      importMetadata,
      segments,
      activeSegmentIndex,
      importing,
      exporting,
      showSegmentationSettings,
      firstImageId,
      labelmap3D,
    } = this.state;

    const { viewports, activeIndex, showColorSelectModal } = this.props;
    const { Modality } = viewports[activeIndex];

    let component;
    let isFractional = false;

    if (labelmap3D) {
      isFractional = labelmap3D.isFractional;
    }

    let exportDisabledMessage;
    if (isFractional) {
      // Note: For now disable export and adding of segments if the labelmap is fractional.
      exportDisabledMessage =
        'Exporting fractional segmentation is not supported yet';
    } else if (UNSUPPORTED_EXPORT_MODALITIES.includes(Modality)) {
      exportDisabledMessage =
        'Segmentation export is not supported for this modality';
    }

    const addSegmentButton = isFractional ? null : (
      <button style={{ fontSize: 12 }} onClick={() => this.onNewSegment()}>
        <Icon name="xnat-tree-plus" /> Mask ROI
      </button>
    );

    if (showSegmentationSettings) {
      component = (
        <XNATSegmentationSettings
          onBack={() => this.setState({ showSegmentationSettings: false })}
        />
      );
    } else if (importing) {
      component = (
        <XNATSegmentationImportMenu
          onImportComplete={this.onIOComplete}
          onImportCancel={this.onIOCancel}
          firstImageId={this.firstImageId}
          labelmap3D={this.labelmap3D}
          viewportData={viewports[activeIndex]}
        />
      );
    } else if (exporting) {
      component = (
        <XNATSegmentationExportMenu
          onExportComplete={this.onIOComplete}
          onExportCancel={this.onIOCancel}
          firstImageId={firstImageId}
          labelmap3D={labelmap3D}
          viewportData={viewports[activeIndex]}
        />
      );
    } else {
      component = (
        <div className="xnatPanel">
          <div className="panelHeader">
            <div className="title-with-icon">
              <h3>Mask-based ROIs</h3>
              <Icon
                className="settings-icon"
                name="cog"
                width="20px"
                height="20px"
                onClick={() =>
                  this.setState({ showSegmentationSettings: true })
                }
              />
            </div>
            <MenuIOButtons
              ImportCallbackOrComponent={XNATSegmentationImportMenu}
              ExportCallbackOrComponent={XNATSegmentationExportMenu}
              onImportButtonClick={() => this.setState({ importing: true })}
              onExportButtonClick={() => this.setState({ exporting: true })}
              exportDisabledMessage={exportDisabledMessage}
            />
          </div>
          <div className="roiCollectionBody">
            <div className="workingCollectionHeader">
              <h4> {importMetadata.name} </h4>
              <div>
                {addSegmentButton}
              </div>
            </div>
            {/*<SegmentationMenuListHeader importMetadata={importMetadata} />*/}
            <div className="collectionSection">
              <table className="collectionTable">
                <thead>
                  <tr>
                    <th width="5%" className="centered-cell">
                      #
                    </th>
                    <th width="75%" className="left-aligned-cell">
                      Label
                      <span style={{ color: 'var(--text-secondary-color)' }}>
                        {' '}
                        / Type{' '}
                      </span>
                    </th>
                    <th width="5%" className="centered-cell">
                      <abbr title="Number of slices">N</abbr>
                    </th>
                    <th width="5%" className="centered-cell" />
                    <th width="5%" className="centered-cell" />
                    <th width="5%" className="centered-cell" />
                  </tr>
                </thead>
                <tbody>
                  <SegmentationMenuListBody
                    segments={segments}
                    activeSegmentIndex={activeSegmentIndex}
                    onSegmentChange={this.onSegmentChange}
                    onEditClick={this.onEditClick}
                    firstImageId={firstImageId}
                    labelmap3D={labelmap3D}
                    showColorSelectModal={showColorSelectModal}
                    onDeleteClick={this.onDeleteClick}
                    onMaskClick={this.onMaskClick}
                  />
                </tbody>
              </table>
            </div>
          </div>
          <SegmentationToolMenu
            activeTool={this.props.activeTool}
            toolData={{
              studies: this.props.studies,
              viewports: this.props.viewports,
              activeIndex: this.props.activeIndex,
              firstImageId: firstImageId,
              segmentsData: { segments, activeSegmentIndex },
              onNewSegment: this.onNewSegment,
            }}
          />
        </div>
      );
    }

    return <React.Fragment>{component}</React.Fragment>;
  }
}

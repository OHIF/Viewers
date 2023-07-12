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
import { connect } from 'react-redux';

// import './XNATRoiPanel.styl';
// import {
//   client,
//   getUpdatedSegments,
//   uncompress,
// } from '@ohif/viewer/src/appExtensions/LungModuleSimilarityPanel/utils.js';
// import { getEnabledElement } from '../../../cornerstone/src/state.js';
// import crypto from 'crypto-js';

const UNSUPPORTED_EXPORT_MODALITIES = ['MG'];

const segmentationModule = cornerstoneTools.getModule('segmentation');
const segmentationState = segmentationModule.state;
const { getToolState } = cornerstoneTools;
const { studyMetadataManager } = utils;

export const _getFirstImageId = ({
  StudyInstanceUID,
  displaySetInstanceUID,
}) => {
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
class XNATSegmentationPanel extends React.Component {
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

  componentDidMount() {
    // const appContext = this.context;

    console.log('segpanel mounted', { props: this.props });
    // this.onImportButtonClick();
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
    // remove segments

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

      const slicexsegments = new Set();
      labelmap3D.labelmaps2D.forEach((labelmap, index) => {
        // console.log('index', index);
        for (let i = 0; i < labelmap.pixelData.length; i++) {
          if (labelmap.pixelData[i] === 1) {
            slicexsegments.add(index);
          }
        }
      });

      const slicexsegmentsArray = Array.from(slicexsegments);

      console.log('-------------------', slicexsegmentsArray);
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
    // const appContext = this.context;
    const { viewports, activeIndex } = this.props;

    console.log('segpanel updated', { props: this.props });

    if (!viewports) {
      return;
    }

    this.props.studies.map(study => {
      const studyMetadata = studyMetadataManager.get(study.StudyInstanceUID);
      if (studyMetadata._displaySets.length == 0) {
        study.displaySets.map(displaySet =>
          studyMetadata.addDisplaySet(displaySet)
        );
      }
    });

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

  onEditSegmentation() {
    console.log('exporting seg');
  }

  onNewSegment(label = 'Unnamed Segment') {
    console.log('add new mask');
    let { labelmap3D, firstImageId } = this.state;

    const newMetadata = generateSegmentationMetadata(label);

    if (labelmap3D) {
      console.log('has label map');
      const { metadata } = labelmap3D;
      let segmentAdded = false;

      // Start from 1, as label 0 is an empty segment.
      for (let i = 1; i < metadata.length; i++) {
        if (!metadata[i]) {
          console.log('no metadata');

          metadata[i] = newMetadata;
          segmentAdded = true;
          labelmap3D.activeSegmentIndex = i;
          break;
        }
      }

      if (!segmentAdded) {
        console.log('segment not added');

        metadata.push(newMetadata);
        labelmap3D.activeSegmentIndex = metadata.length - 1;
      }
    } else {
      console.log('no label map');
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
    const StudyInstanceUID = cornerstone.metaData.get(
      'StudyInstanceUID',
      imageId
    );

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

  // addSegmentationToCanvas({ segmentation, label, element }) {
  //   console.warn({ segmentation, label, element });
  //   const labelmap2D = segmentationModule.getters.labelmap2D(element);
  //   const {
  //     labelmap3D,
  //     currentImageIdIndex,
  //     activeLabelmapIndex,
  //     ...rest
  //   } = segmentationModule.getters.labelmap2D(element);

  //   let segmentIndex = labelmap3D.activeSegmentIndex;
  //   let metadata = labelmap3D.metadata[segmentIndex];

  //   console.log({
  //     metadata,
  //     segmentIndex,
  //   });

  //   if (!metadata) {
  //     console.warn('layer not occupied');

  //     metadata = generateSegmentationMetadata(label);
  //     segmentIndex = labelmap3D.activeSegmentIndex;

  //     const updated2dMaps = getUpdatedSegments({
  //       segmentation,
  //       segmentIndex,
  //       currPixelData: labelmap3D.labelmaps2D,
  //     });
  //     console.log({
  //       updated2dMaps,
  //     });

  //     labelmap2D.labelmap3D.labelmaps2D = updated2dMaps;
  //     if (segmentIndex === 1) {
  //       const mDataInit = Array(1);
  //       mDataInit[1] = metadata;
  //       labelmap2D.labelmap3D.metadata = mDataInit;
  //     } else {
  //       labelmap2D.labelmap3D.metadata[segmentIndex] = metadata;
  //     }
  //     labelmap2D.labelmap3D.activeSegmentIndex = segmentIndex;

  //     console.warn('updatedLabelmaps2s', {
  //       labelmap2D,
  //       segmentIndex,
  //     });
  //     segmentationModule.setters.updateSegmentsOnLabelmap2D(labelmap2D);

  //     console.log({
  //       updatedLm2d: segmentationModule.getters.labelmap2D(element),
  //     });

  //     refreshViewports();
  //     triggerEvent(element, 'peppermintautosegmentgenerationevent', {});
  //   } else {
  //     //theres something on this layer so we need to find the last layer and work on the one after it
  //     console.warn('layer occupied', labelmap3D);

  //     metadata = generateSegmentationMetadata(label);
  //     segmentIndex = labelmap3D.metadata.length;

  //     const updated2dMaps = getUpdatedSegments({
  //       segmentation,
  //       segmentIndex,
  //       currPixelData: labelmap3D.labelmaps2D,
  //     });
  //     console.log({
  //       updated2dMaps,
  //     });

  //     labelmap2D.labelmap3D.labelmaps2D = updated2dMaps;
  //     labelmap2D.labelmap3D.metadata[segmentIndex] = metadata;
  //     labelmap2D.labelmap3D.activeSegmentIndex = segmentIndex;

  //     console.log({ labelmap2D, segmentIndex });
  //     segmentationModule.setters.updateSegmentsOnLabelmap2D(labelmap2D);

  //     console.log({
  //       updatedLm2d: segmentationModule.getters.labelmap2D(element),
  //     });

  //     refreshViewports();
  //     triggerEvent(element, 'peppermintautosegmentgenerationevent', {});
  //   }
  // }

  // importSegmentationLayers({ segmentations }) {
  //   const segmentationsList = Object.keys(segmentations);
  //   console.log({ segmentationsList });

  //   const hashBucket = {};

  //   segmentationsList.forEach(async (item, index) => {
  //     console.log({ item });
  //     const segDetails = segmentations[item];

  //     // const hashed = await sha256(item);
  //     const hashed = crypto.SHA512(segDetails.segmentation).toString();
  //     console.log({
  //       hashed,
  //       segDetails,
  //     });

  //     hashBucket[item] = hashed;

  //     const uncompressed = uncompress({
  //       segmentation: segDetails.segmentation,
  //       shape:
  //         typeof segDetails.shape === 'string'
  //           ? JSON.parse(segDetails.shape)
  //           : segDetails.shape,
  //     });
  //     console.log({
  //       uncompressed,
  //     });

  //     const view_ports = cornerstone.getEnabledElements();
  //     const viewports = view_ports[0];

  //     const element = getEnabledElement(view_ports.indexOf(viewports));
  //     if (!element) {
  //       return;
  //     }

  //     console.warn({
  //       uncompressed,
  //       item,
  //     });

  //     this.addSegmentationToCanvas({
  //       segmentation: uncompressed,
  //       label: item,
  //       element,
  //     });
  //   });

  //   console.log({ hashBucket });
  //   // const appContext = this.context;
  //   this.props.appContext.setEditedSegmentation(hashBucket);
  // }

  // fetchSegmentationsFromLocalStorage() {
  //   try {
  //     const segmentationsJson = localStorage.getItem('segmentation');
  //     console.log({ segmentationsJson });
  //     const segmentations =
  //       segmentationsJson && segmentationsJson !== 'undefined'
  //         ? JSON.parse(segmentationsJson)
  //         : {};
  //     return segmentations;
  //   } catch (error) {
  //     console.log({ error });
  //   }
  // }

  // fetchSegmentations() {
  //   return new Promise(async (res, rej) => {
  //     try {
  //       console.log('fetch segmentation', this.props);
  //       const series_uid = this.props.viewports[0].SeriesInstanceUID;
  //       // const email = 'nick.fragakis%40thetatech.ai';
  //       const email = this.props.user.profile.email;

  //       console.log({ series_uid });

  //       const body = {
  //         email: 'bimpongamoako@gmail.com', //'nick.fragakis@thetatech.ai',
  //       };

  //       console.log({ payload: body });

  //       await client
  //         .get(`/segmentations?series=${series_uid}&email=${email}`, body)
  //         .then(async response => {
  //           console.log({ response });
  //           res(response.data);
  //         })
  //         .catch(error => {
  //           console.log(error);
  //         });
  //     } catch (error) {
  //       console.log({ error });
  //       rej(error);
  //     }
  //   });
  // }

  // async onImportButtonClick() {
  //   //  const segmentations = this.fetchSegmentationsFromLocalStorage();
  //   const segmentations = await this.fetchSegmentations();
  //   console.log({ segmentations });
  //   this.importSegmentationLayers({
  //     segmentations,
  //   });
  //   this.onIOComplete();
  //   return;
  // }

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
                  this.setState({
                    showSegmentationSettings: true,
                  })
                }
              />
            </div>
            <MenuIOButtons
              // ImportCallbackOrComponent={XNATSegmentationImportMenu}
              ExportCallbackOrComponent={XNATSegmentationExportMenu}
              // onImportButtonClick={() => this.setState({ importing: true })}
              onExportButtonClick={() => this.setState({ exporting: true })}
              exportDisabledMessage={exportDisabledMessage}
            />
          </div>
          <div className="roiCollectionBody">
            <div className="workingCollectionHeader">
              <h4> {importMetadata.name} </h4>
              <div>{addSegmentButton}</div>
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
                      <span
                        style={{
                          color: 'var(--text-secondary-color)',
                        }}
                      >
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

const mapStateToProps = state => {
  return {
    user: state.oidc.user,
  };
};

const ConnectedSegmentationPanel = connect(
  mapStateToProps,
  null
)(XNATSegmentationPanel);

export default ConnectedSegmentationPanel;

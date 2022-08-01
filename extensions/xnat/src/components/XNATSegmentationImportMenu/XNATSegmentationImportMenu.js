import React from 'react';
// import MaskImporter from '../../utils/IO/classes/MaskImporter';
// import fetchJSON from '../../utils/IO/fetchJSON.js';
// import fetchArrayBuffer from '../../utils/IO/fetchArrayBuffer.js';
import cornerstoneTools from 'cornerstone-tools';
// import sessionMap from '../../utils/sessionMap';
// import getReferencedScan from '../../utils/getReferencedScan';
import { getEnabledElement } from '../../../../cornerstone/src/state';
import { Icon } from '@ohif/ui';
// import { Loader } from '../../elements';
// import importMaskRoiCollection from '../../utils/IO/importMaskRoiCollection';
import samplePixelData from './samplePixelData.json';

import '../XNATRoiPanel.styl';
import { generateSegmentationMetadata } from '../../peppermint-tools';
import { triggerEvent } from 'cornerstone-core';
import refreshViewports from '../../../../dicom-segmentation/src/utils/refreshViewports';
import {
  client,
  getUpdatedSegments,
  // compressedToMatrix,
  // renderSegmentation,
  uncompress,
} from '../../../../../platform/viewer/src/appExtensions/LungModuleSimilarityPanel/utils';
// import { getToggledPixels } from './samplePixelData';
import List, {
  ListItem,
} from '../../../../../platform/viewer/src/appExtensions/LungModuleSimilarityPanel/components/list';
// import { flatten } from 'mathjs';

const segmentationModule = cornerstoneTools.getModule('segmentation');

/*const overwriteConfirmationContent = {
  title: `Warning`,
  body: `
    Loading in another Segmentation will overwrite existing segmentation data. Are you sure
    you want to do this?
  `,
};*/

export default class XNATSegmentationImportMenu extends React.Component {
  constructor(props = {}) {
    super(props);

    this.state = {
      //  sessionRoiCollections,
      //  sessionSelected,
      importListReady: false,
      importing: false,
      progressText: '',
      importProgress: 0,
      segmentations: {},
      selectedSegmentation: '',
    };

    this._cancelablePromises = [];
    this._validTypes = ['SEG'];
    // this.onImportButtonClick = this.onImportButtonClick.bind(this);
    // this.onCloseButtonClick = this.onCloseButtonClick.bind(this);
    // this._collectionEligibleForImport = this._collectionEligibleForImport.bind(
    //   this
    // );

    // this._hasExistingMaskData = this._hasExistingMaskData.bind(this);
    // this._updateImportingText = this._updateImportingText.bind(this);

    // this.updateProgress = this.updateProgress.bind(this);
  }

  /**
   * componentWillUnmount - If any promises are active, cancel them to avoid
   * memory leakage by referencing `this`.
   *
   * @returns {null}
   */
  // componentWillUnmount() {
  //   const cancelablePromises = this._cancelablePromises;

  //   for (let i = 0; i < cancelablePromises.length; i++) {
  //     if (typeof cancelablePromises[i].cancel === 'function') {
  //       cancelablePromises[i].cancel();
  //     }
  //   }
  // }

  /**
   * componentDidMount - On mounting, fetch a list of available projects from XNAT.
   *
   * @returns {type}  description
   */
  componentDidMount() {
    //fetch and populate import list
    // this.initImportPanel();
    // this.onImportButtonClick();
    // const view_ports = cornerstone.getEnabledElements();
    // const viewports = view_ports[0];

    // const element = getEnabledElement(view_ports.indexOf(viewports));

    // const l2d = segmentationModule.getters.labelmap2D(element);
    // const metaData = segmentationModule.getters.metadata(element);
    // console.log({ l2d, metaData, segmentationModule });

    console.log('import onmount');

    //  this.importFromLocalStorage();
    this.onImportButtonClick();
  }

  // async initImportPanel() {
  //   const segmentations = await this.fetchSegmentations();

  //   this.setState({
  //     importListReady: true,
  //     segmentations,
  //   });
  // }

  getSegmentationName(key) {
    return key.split('-').join(' ');
  }

  //  onSessionSelectedChange(evt) {
  //    this.setState({ sessionSelected: evt.target.value });
  //  }

  // updateProgress(percent) {
  //   this.setState({ importProgress: percent });
  // }

  /**
   * onSelectedScanChange - Update the scanSelected state.
   *
   * @param  {Object} evt  The event.
   * @returns {null}
   */
  //  onSelectedScanChange(evt) {
  //    const {
  //      sessionRoiCollections,
  //      sessionSelected,
  //    } = this.state;
  //    const currentCollection =
  //      sessionRoiCollections[sessionSelected];
  //    currentCollection.scanSelected = evt.target.value;

  //    this.setState({ sessionRoiCollections });
  //  }

  /**
   * onCloseButtonClick - Cancel the import and switch back to the
   * SegmentationMenu view.
   *
   * @returns {null}
   */
  onCloseButtonClick() {
    this.props.onImportCancel();
  }

  /**
   * onChangeRadio - Update the segmentationSelected index on radio input.
   *
   * @param  {Object} evt   The event.
   * @param  {number} index The index of the radio button.
   * @returns {null}
   */
  //  onChangeRadio(evt, id) {
  //    const {
  //      sessionRoiCollections,
  //      sessionSelected,
  //    } = this.state;
  //    const currentCollection =
  //      sessionRoiCollections[sessionSelected];

  //    currentCollection.segmentationSelected = id;

  //    this.setState({ sessionRoiCollections });
  //  }

  /**
   * async onImportButtonClick - Import the mask after a possible overwrite confirmation.
   *
   * @returns {null}
   */

  // selectSegmentation({ key, segmentations }) {
  //   console.log('selecting segmentation', key, segmentations);
  //   const raw = segmentations[key];
  //   console.log({ raw });

  //   const shape = JSON.parse(raw.shape);
  //   console.log({ shape });

  //   const segmentation = uncompress({
  //     segmentation: raw.segmentation,
  //     shape: shape,
  //   });
  //   console.log({ segmentation });

  //   return segmentation;
  // }

  // importSegmentation({ element, segmentation }) {
  //   console.log('1', {
  //     segmentationModule,
  //     segmentation,
  //   });
  //   const {
  //     labelmap3D,
  //     currentImageIdIndex,
  //     activeLabelmapIndex,
  //     ...rest
  //   } = segmentationModule.getters.labelmap2D(element);

  //   const labelMap2d = segmentationModule.getters.labelmap2D(element);
  //   const labelMap3d = segmentationModule.getters.labelmap3D(
  //     element,
  //     activeLabelmapIndex
  //   );

  //   console.log({
  //     rest,
  //     labelmap3D,
  //     segmentationModule,
  //     labelMap2d,
  //     labelMap3d,
  //   });

  //   let segmentIndex = labelmap3D.activeSegmentIndex;
  //   let metadata = labelmap3D.metadata[segmentIndex];

  //   console.log({
  //     metadata,
  //     segmentIndex,
  //   });

  //   if (!metadata) {
  //     metadata = generateSegmentationMetadata('Unnamed Segment');
  //     segmentIndex = labelmap3D.activeSegmentIndex;

  //     segmentationModule.setters.metadata(
  //       element,
  //       activeLabelmapIndex,
  //       segmentIndex,
  //       metadata,
  //       samplePixelData
  //     );

  //     const updated2dMaps = this.getUpdatedSegments(segmentation);
  //     console.log({
  //       updated2dMaps,
  //     });

  //     labelMap2d.labelmap3D.labelmaps2D = updated2dMaps;

  //     console.log({ labelMap2d });
  //     segmentationModule.setters.updateSegmentsOnLabelmap2D(labelMap2d);

  //     console.log({
  //       updatedLm2d: segmentationModule.getters.labelmap2D(element),
  //     });

  //     refreshViewports();
  //     triggerEvent(element, 'peppermintautosegmentgenerationevent', {});
  //   }
  // }

  // addSegmentsWithNewMetaData({
  //   segmentation,
  //   labelmap2D,
  //   element,
  //   segmentIndex,
  // }) {
  //   const { labelmap3D } = labelmap2D;
  //   // let segmentIndex = labelmap3D.activeSegmentIndex;
  //   let metadata = labelmap3D.metadata[segmentIndex];

  //   console.log('addSegmentsWithNewMetaData', {
  //     metadata,
  //     segmentIndex,
  //   });

  //   //  segmentationModule.setters.metadata(
  //   //    element,
  //   //    activeLabelmapIndex,
  //   //    segmentIndex,
  //   //    metadata,
  //   //    samplePixelData
  //   //  );

  //   const updated2dMaps = this.getUpdatedSegments({
  //     segmentation,
  //     segmentIndex,
  //   });
  //   console.log({
  //     updated2dMaps,
  //   });

  //   labelmap2D.labelmap3D.labelmaps2D = updated2dMaps;

  //   console.log({ labelmap2D });
  //   segmentationModule.setters.updateSegmentsOnLabelmap2D(labelmap2D);

  //   console.log({
  //     updatedLm2d: segmentationModule.getters.labelmap2D(element),
  //   });

  //   refreshViewports();
  //   triggerEvent(element, 'peppermintautosegmentgenerationevent', {});
  //   //  }
  // }

  addSegmentationToCanvas({ segmentation, label, element }) {
    console.warn({ segmentation, label, element });
    const labelmap2D = segmentationModule.getters.labelmap2D(element);
    const {
      labelmap3D,
      currentImageIdIndex,
      activeLabelmapIndex,
      ...rest
    } = segmentationModule.getters.labelmap2D(element);

    let segmentIndex = labelmap3D.activeSegmentIndex;
    let metadata = labelmap3D.metadata[segmentIndex];

    console.log({
      metadata,
      segmentIndex,
    });

    if (!metadata) {
      console.warn('layer not occupied');

      metadata = generateSegmentationMetadata(label);
      segmentIndex = labelmap3D.activeSegmentIndex;

      // segmentationModule.setters.metadata(
      //   element,
      //   activeLabelmapIndex,
      //   segmentIndex,
      //   metadata,
      //   samplePixelData
      // );

      const updated2dMaps = getUpdatedSegments({
        segmentation,
        segmentIndex,
        currPixelData: labelmap3D.labelmaps2D,
      });
      console.log({
        updated2dMaps,
      });

      labelmap2D.labelmap3D.labelmaps2D = updated2dMaps;
      if (segmentIndex === 1) {
        const mDataInit = Array(1);
        mDataInit[1] = metadata;
        labelmap2D.labelmap3D.metadata = mDataInit;
      } else {
        labelmap2D.labelmap3D.metadata[segmentIndex] = metadata;
      }
      labelmap2D.labelmap3D.activeSegmentIndex = segmentIndex;

      console.warn('updatedLabelmaps2s', {
        labelmap2D,
        segmentIndex,
      });
      segmentationModule.setters.updateSegmentsOnLabelmap2D(labelmap2D);

      console.log({
        updatedLm2d: segmentationModule.getters.labelmap2D(element),
      });

      refreshViewports();
      triggerEvent(element, 'peppermintautosegmentgenerationevent', {});
    } else {
      //theres something on this layer so we need to find the last layer and work on the one after it
      console.warn('layer occupied', labelmap3D);

      metadata = generateSegmentationMetadata(label);
      segmentIndex = labelmap3D.metadata.length;

      // segmentationModule.setters.metadata(
      //   element,
      //   activeLabelmapIndex,
      //   segmentIndex,
      //   metadata,
      //   samplePixelData
      // );

      const updated2dMaps = getUpdatedSegments({
        segmentation,
        segmentIndex,
        currPixelData: labelmap3D.labelmaps2D,
      });
      console.log({
        updated2dMaps,
      });

      labelmap2D.labelmap3D.labelmaps2D = updated2dMaps;
      labelmap2D.labelmap3D.metadata[segmentIndex] = metadata;
      labelmap2D.labelmap3D.activeSegmentIndex = segmentIndex;

      console.log({ labelmap2D, segmentIndex });
      segmentationModule.setters.updateSegmentsOnLabelmap2D(labelmap2D);

      console.log({
        updatedLm2d: segmentationModule.getters.labelmap2D(element),
      });

      refreshViewports();
      triggerEvent(element, 'peppermintautosegmentgenerationevent', {});
    }

    // if (labelmap2D.labelmap3D) {
    //   const { metadata } = labelmap2D.labelmap3D;
    //   console.log('import. has labelmap', { metadata });
    //   let segmentAdded = false;

    //   // Start from 1, as label 0 is an empty segment.
    //   for (let i = 1; i < metadata.length; i++) {
    //     if (!metadata[i]) {
    //       console.log('no metadata');

    //       metadata[i] = newMetadata;
    //       segmentAdded = true;
    //       labelmap2D.labelmap3D.activeSegmentIndex = i;

    //       // this.addSegmentsWithNewMetaData({
    //       //   segmentation,
    //       //   labelmap2D,
    //       //   element,
    //       //   segmentIndex: i,
    //       // });
    //       break;
    //     }
    //   }

    //   if (!segmentAdded) {
    //     console.log('segment not added');

    //     metadata.push(newMetadata);
    //     labelmap2D.labelmap3D.activeSegmentIndex =
    //       metadata.length === 1 ? 1 : metadata.length - 1;
    //     this.addSegmentsWithNewMetaData({
    //       segmentation,
    //       labelmap2D,
    //       element,
    //       segmentIndex: metadata.length === 1 ? 1 : metadata.length - 1,
    //     });
    //   }
    // } else {
    //   console.log('import. no labelmap');
    //   //  const element = getElementFromFirstImageId(firstImageId);

    //   const labelmapData = segmentationModule.getters.labelmap2D(element);

    //   // labelmap3D = labelmapData.labelmap3D;

    //   const { metadata } = labelmapData.labelmap3D;

    //   metadata[1] = newMetadata;
    //   labelmapData.labelmap3D.activeSegmentIndex = 1;
    //   this.addSegmentsWithNewMetaData({
    //     segmentation,
    //     labelmap2D: labelmapData,
    //     element,
    //     segmentIndex: 1,
    //   });
    // }

    // // const segments = this.constructor._segments(firstImageId);
    // // const activeSegmentIndex = this._getActiveSegmentIndex(firstImageId);

    // //  this.setState({
    // //    segments,
    // //    activeSegmentIndex,
    // //    labelmap3D,
    // //  });

    // //  refreshViewports();

    // //  return activeSegmentIndex;
  }

  // importSegmentationByIndex({ element, segmentation, index }) {
  //   console.log('1', {
  //     segmentationModule,
  //     segmentation,
  //   });
  //   const {
  //     labelmap3D,
  //     currentImageIdIndex,
  //     activeLabelmapIndex,
  //     ...rest
  //   } = segmentationModule.getters.labelmap2D(element);

  //   return;

  //   const labelMap2d = segmentationModule.getters.labelmap2D(element);
  //   const labelMap3d = segmentationModule.getters.labelmap3D(
  //     element,
  //     activeLabelmapIndex
  //   );

  //   console.log({
  //     rest,
  //     labelmap3D,
  //     segmentationModule,
  //     labelMap2d,
  //     labelMap3d,
  //   });

  //   let segmentIndex = labelmap3D.activeSegmentIndex;
  //   let metadata = labelmap3D.metadata[segmentIndex];

  //   console.log({
  //     metadata,
  //     segmentIndex,
  //   });

  //   if (!metadata) {
  //     metadata = generateSegmentationMetadata('Unnamed Segment');
  //     segmentIndex = labelmap3D.activeSegmentIndex;

  //     segmentationModule.setters.metadata(
  //       element,
  //       activeLabelmapIndex,
  //       segmentIndex,
  //       metadata,
  //       samplePixelData
  //     );

  //     const updated2dMaps = this.getUpdatedSegments(segmentation);
  //     console.log({
  //       updated2dMaps,
  //     });

  //     labelMap2d.labelmap3D.labelmaps2D = updated2dMaps;

  //     console.log({ labelMap2d });
  //     segmentationModule.setters.updateSegmentsOnLabelmap2D(labelMap2d);

  //     console.log({
  //       updatedLm2d: segmentationModule.getters.labelmap2D(element),
  //     });

  //     refreshViewports();
  //     triggerEvent(element, 'peppermintautosegmentgenerationevent', {});
  //   }
  // }

  importSegmentationLayers({ segmentations }) {
    const segmentationsList = Object.keys(segmentations);
    console.log({ segmentationsList });

    segmentationsList.forEach((item, index) => {
      console.log({ item });
      const segDetails = segmentations[item];

      const uncompressed = uncompress({
        segmentation: segDetails.segmentation,
        shape:
          typeof segDetails.shape === 'string'
            ? JSON.parse(segDetails.shape)
            : segDetails.shape,
      });
      console.log({ uncompressed });

      const view_ports = cornerstone.getEnabledElements();
      const viewports = view_ports[0];

      const element = getEnabledElement(view_ports.indexOf(viewports));
      if (!element) {
        return;
      }

      console.warn({ uncompressed, item });

      this.addSegmentationToCanvas({
        segmentation: uncompressed,
        label: item,
        element,
      });

      // const segmentationModule.

      // refreshViewports();
      // triggerEvent(element, 'peppermintautosegmentgenerationevent', {});

      // this.importSegmentation({
      //   element,
      //   segmentation: uncompressed,
      // });
    });
  }

  importFromLocalStorage() {
    try {
      const segmentationsJson = localStorage.getItem('segmentation');
      console.log({ segmentationsJson });
      const segmentations =
        segmentationsJson && segmentationsJson !== 'undefined'
          ? JSON.parse(segmentationsJson)
          : {};
      console.log({ segmentations });

      this.importSegmentationLayers({ segmentations });

      return;
      const uncompressed = uncompress({
        segmentation: segmentations.segmentation,
        shape: {
          rows: 512,
          cols: 512,
          slices: 64,
        },
      });
      console.log({ uncompressed, thiss: this });

      const view_ports = cornerstone.getEnabledElements();
      const viewports = view_ports[0];

      const element = getEnabledElement(view_ports.indexOf(viewports));
      if (!element) {
        return;
      }
      this.importSegmentation({
        element,
        segmentation: uncompressed,
      });
    } catch (error) {
      console.log({ error });
    }
  }

  fetchSegmentations() {
    return new Promise(async (res, rej) => {
      try {
        console.log('fetch segmentation', this.props);
        const series_uid = this.props.viewportData.SeriesInstanceUID;
        //  const study_uid = this.props.viewport
        //    .viewportSpecificData[0].StudyInstanceUID;

        // const series_uid =
        //   '1.3.6.1.4.1.32722.99.99.214642655244717272584917035206416218742';
        // '1.3.6.1.4.1.32722.99.99.71621653125201582124240564508842688465';
        // const email = this.props.user.profile.email;
        const email = 'nick.fragakis%40thetatech.ai';

        // const compressed = await this.handleSegmentationCompression(segmentation);
        // console.log({ compressed });

        // get current image
        // const image = cornerstone.getImage(element);
        // extract instance uid from the derived image data
        // const instance_uid = image.imageId.split('/')[18];
        console.log({ series_uid });

        const body = {
          // study_uid: study_uid,
          // series_uid: series_uid,
          email: 'bimpongamoako@gmail.com', //'nick.fragakis@thetatech.ai',
          // instance_uid,
          // segmentation: compressed,
          // label: 'label',
        };

        console.log({ payload: body });

        await client
          .get(`/segmentations?series=${series_uid}&email=${email}`, body)
          .then(async response => {
            console.log({ response });
            res(response.data);
          })
          .catch(error => {
            console.log(error);
          });
      } catch (error) {
        console.log({ error });
        rej(error);
      }
    });
  }

  // overlaySeg(element) {
  //   fetch(
  //     'https://radcadapi.thetatech.ai/segmentations?series=1.3.6.1.4.1.32722.99.99.214642655244717272584917035206416218742&email=nick.fragakis%40thetatech.ai'
  //   )
  //     .then(response => response.json())
  //     .then(data => {
  //       console.log(data);

  //       // loop through segmentations
  //       // const segmentation_labels = Object.keys(data);
  //       const segmentation_labels = [
  //         'Lung-Left',
  //         'Lung-Right',
  //         'Spinal-Cord',
  //         // 'GTV-1',
  //         // 'Neoplasm, Primary-1',
  //         // 'Lung-2',
  //         // 'Lung-3',
  //         // 'Spinal cord-4',
  //       ];

  //       const num_segmentations = segmentation_labels.length;
  //       for (
  //         let segmentation_index = 0;
  //         segmentation_index < num_segmentations;
  //         segmentation_index++
  //       ) {
  //         // get the segmentation data
  //         const segmentation_label = segmentation_labels[segmentation_index];
  //         const segmentation = data[segmentation_label]['segmentation'];
  //         const shape = JSON.parse(data[segmentation_label]['shape']);

  //         const seg_matrix = compressedToMatrix(segmentation, shape);
  //         console.log({ [segmentation_label]: seg_matrix });

  //         const stackToolState = cornerstoneTools.getToolState(
  //           element,
  //           'stack'
  //         );
  //         const imageIds = stackToolState.data[0].imageIds;
  //         console.log({ imageIds });

  //         cornerstone.loadImage(imageIds[0]).then(function(image) {
  //           const h = image.height;
  //           const w = image.width;
  //           console.log({ image, h, w });

  //           const starting_slice = 0;
  //           const max_slices = imageIds.length;
  //           let stack_slice = 0;

  //           for (
  //             let which_slice = starting_slice;
  //             which_slice < starting_slice + max_slices;
  //             which_slice++, stack_slice++
  //           ) {
  //             console.log(
  //               segmentation_label,
  //               ' Rendering Slice ',
  //               stack_slice,
  //               '/',
  //               max_slices
  //             );
  //             const { getters } = cornerstoneTools.getModule('segmentation');

  //             renderSegmentation(
  //               element,
  //               which_slice,
  //               seg_matrix,
  //               stack_slice,
  //               h,
  //               w,
  //               getters
  //             );
  //           }
  //         });
  //       }
  //       console.log('Done rendering segmentations.');
  //     });
  //   //////////////////////////////////////////////////////////////////////////////////
  // }

  async onImportButtonClick() {
    const segmentations = await this.fetchSegmentations();
    console.log({ segmentations });
    this.importSegmentationLayers({ segmentations });

    return;
    console.log('import segmentation');
    // const segmentation = this.selectSegmentation({
    //   key: this.state.selectedSegmentation,
    //   segmentations: this.state.segmentations,
    // });
    // console.log('start import', {
    //   // samplePixelData,
    //   segmentation,
    // });
    this.setState({ importing: true });

    const view_ports = cornerstone.getEnabledElements();
    const viewports = view_ports[0];

    // setting active viewport reference to element variable
    const element = getEnabledElement(view_ports.indexOf(viewports));
    if (!element) {
      return;
    }
    // this.importSegmentation({
    //   element,
    //   segmentation: segmentation, //new Uint8Array(segmentation),
    // });
    this.overlaySeg(element);
    return;
  }

  /**
   * _hasExistingMaskData - Check if we either have an import
   *                        (quicker to check), or we have some data.
   *
   * @returns {boolean}  Whether mask data exists.
   */
  // _hasExistingMaskData(firstImageId) {
  //   if (segmentationModule.getters.importMetadata(firstImageId)) {
  //     return true;
  //   }

  //   const brushStackState = segmentationModule.state.series[firstImageId];

  //   if (!brushStackState) {
  //     return false;
  //   }

  //   const labelmap3D =
  //     brushStackState.labelmaps3D[brushStackState.activeLabelmapIndex];

  //   if (!labelmap3D) {
  //     return false;
  //   }

  //   return labelmap3D.metadata.some(data => data !== undefined);
  // }

  /**
   * componentWillUnmount - If any promises are active, cancel them to avoid
   * memory leakage by referencing `this`.
   *
   * @returns {null}
   */
  // componentWillUnmount() {
  //   const cancelablePromises = this._cancelablePromises;

  //   for (let i = 0; i < cancelablePromises.length; i++) {
  //     if (typeof cancelablePromises[i].cancel === 'function') {
  //       cancelablePromises[i].cancel();
  //     }
  //   }
  // }

  /**
   * _updateImportingText - Updates the progressText state.
   *
   * @param  {string} roiCollectionLabel The label of the ROI Collection.
   * @returns {null}
   */
  // _updateImportingText(roiCollectionLabel) {
  //   this.setState({
  //     progressText: roiCollectionLabel,
  //   });
  // }

  /**
   * _collectionEligibleForImport - Returns true if the roiCollection references
   * the active series, and hasn't already been imported.
   *
   * @param  {Object} collectionInfoJSON  An object containing information about
   *                                      the collection.
   * @returns {boolean}                    Whether the collection is eligible
   *                                      for import.
   */
  // _collectionEligibleForImport(collectionInfoJSON) {
  //   const item = collectionInfoJSON.items[0];

  //   const collectionType = item.data_fields.collectionType;

  //   if (!this._validTypes.some(type => type === collectionType)) {
  //     return false;
  //   }

  //   return true;
  // }

  render() {
    const { importing } = this.state;

    return (
      <div className="xnatPanel">
        <div className="panelHeader">
          <h3>Import mask-based ROI collections</h3>
          {importing ? null : (
            <button className="small" onClick={this.onCloseButtonClick}>
              <Icon name="xnat-cancel" />.
            </button>
          )}
        </div>
        <div className="roiCollectionBody limitHeight">
          {this.state.importListReady ? (
            JSON.stringify(this.state.segmentations) !== '{}' ? (
              <div>
                {Object.keys(this.state.segmentations).map((item, index) => {
                  const title = this.getSegmentationName(item);

                  return (
                    <ListItem
                      key={item}
                      index={index}
                      title={`${title}`}
                      isSelected={this.state.selectedSegmentation === item}
                      onClick={() =>
                        this.setState({
                          selectedSegmentation:
                            this.state.selectedSegmentation === item
                              ? ''
                              : item,
                        })
                      }
                    />
                  );
                })}
              </div>
            ) : (
              <p>No Segmentations</p>
            )
          ) : (
            <p>Loading...</p>
          )}
        </div>
        <div className="roiCollectionFooter">
          {/* {importing
            ? null
            : !this.state.selectedSegmentation && ( */}
          {/* <div>
                           <button
                             onClick={() => this.importFromLocalStorage()}
                           >
                             <Icon name="xnat-import" />
                             Import Local
                           </button>
                           <button onClick={this.onImportButtonClick}>
                             <Icon name="xnat-import" />
                             Import Remote
                           </button>
                         </div> */}
          {/* )} */}
        </div>
      </div>
    );
  }
}

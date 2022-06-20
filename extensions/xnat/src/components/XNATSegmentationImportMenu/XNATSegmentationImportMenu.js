import React from 'react';
import MaskImporter from '../../utils/IO/classes/MaskImporter';
import fetchJSON from '../../utils/IO/fetchJSON.js';
import fetchArrayBuffer from '../../utils/IO/fetchArrayBuffer.js';
import cornerstoneTools from 'cornerstone-tools';
import sessionMap from '../../utils/sessionMap';
import getReferencedScan from '../../utils/getReferencedScan';
import { getEnabledElement } from '../../../../cornerstone/src/state';
import { Icon } from '@ohif/ui';
import { Loader } from '../../elements';
import importMaskRoiCollection from '../../utils/IO/importMaskRoiCollection';
import samplePixelData from './samplePixelData.json';

import '../XNATRoiPanel.styl';
import { generateSegmentationMetadata } from '../../peppermint-tools';
import { triggerEvent } from 'cornerstone-core';
import refreshViewports from '../../../../dicom-segmentation/src/utils/refreshViewports';
import {
  client,
  uncompress,
} from '../../../../../platform/viewer/src/appExtensions/LungModuleSimilarityPanel/utils';
import { getToggledPixels } from './samplePixelData';
import List, {
  ListItem,
} from '../../../../../platform/viewer/src/appExtensions/LungModuleSimilarityPanel/components/list';

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
    this.onImportButtonClick = this.onImportButtonClick.bind(this);
    this.onCloseButtonClick = this.onCloseButtonClick.bind(this);
    this._collectionEligibleForImport = this._collectionEligibleForImport.bind(
      this
    );

    this._hasExistingMaskData = this._hasExistingMaskData.bind(this);
    this._updateImportingText = this._updateImportingText.bind(this);

    this.updateProgress = this.updateProgress.bind(this);
  }

  /**
   * componentWillUnmount - If any promises are active, cancel them to avoid
   * memory leakage by referencing `this`.
   *
   * @returns {null}
   */
  componentWillUnmount() {
    const cancelablePromises = this._cancelablePromises;

    for (let i = 0; i < cancelablePromises.length; i++) {
      if (typeof cancelablePromises[i].cancel === 'function') {
        cancelablePromises[i].cancel();
      }
    }
  }

  /**
   * componentDidMount - On mounting, fetch a list of available projects from XNAT.
   *
   * @returns {type}  description
   */
  componentDidMount() {
    //fetch and populate import list
    this.initImportPanel();
  }

  async initImportPanel() {
    const segmentations = await this.fetchSegmentations();

    this.setState({
      importListReady: true,
      segmentations,
    });
  }

  getSegmentationName(key) {
    return key.split('-').join(' ');
  }

  //  onSessionSelectedChange(evt) {
  //    this.setState({ sessionSelected: evt.target.value });
  //  }

  updateProgress(percent) {
    this.setState({ importProgress: percent });
  }

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

  selectSegmentation({ key, segmentations }) {
    console.log('selecting segmentation', key, segmentations);
    const raw = segmentations[key];
    console.log({ raw });

    const shape = JSON.parse(raw.shape);
    console.log({ shape });

    const segmentation = uncompress({
      segmentation: raw.segmentation,
      shape: shape,
    });
    console.log({ segmentation });

    return segmentation;
  }

  fetchSegmentations() {
    return new Promise(async (res, rej) => {
      try {
        console.log('fetch segmentation', this.props);
        //  const series_uid = this.props.viewport
        //  .viewportSpecificData[0];
        // .SeriesInstanceUID;
        //  const study_uid = this.props.viewport
        //    .viewportSpecificData[0].StudyInstanceUID;

        const series_uid =
          '1.3.6.1.4.1.32722.99.99.214642655244717272584917035206416218742';
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

  getUpdatedSegments(segmentations) {
    return segmentations.map((item, index) => {
      const flattened = [].concat(...item);

      // if (index % 2 || index === 0) {
      //   const pxData = getToggledPixels(flattened);
      //   console.log({ pxData });

      //   return {
      //     pixelData: pxData,
      //     segmentsOnLabelmap: [0, 1],
      //   };
      // }

      return {
        pixelData: flattened,
        segmentsOnLabelmap: [0, 1],
      };
    });
  }

  importSegmentation({ element, segmentation }) {
    console.log('1', {
      segmentationModule,
      segmentation,
    });
    const {
      labelmap3D,
      currentImageIdIndex,
      activeLabelmapIndex,
      ...rest
    } = segmentationModule.getters.labelmap2D(element);

    const labelMap2d = segmentationModule.getters.labelmap2D(element);
    const labelMap3d = segmentationModule.getters.labelmap3D(
      element,
      activeLabelmapIndex
    );

    console.log({
      rest,
      labelmap3D,
      segmentationModule,
      labelMap2d,
      labelMap3d,
    });

    let segmentIndex = labelmap3D.activeSegmentIndex;
    let metadata = labelmap3D.metadata[segmentIndex];

    console.log({ metadata, segmentIndex });

    if (!metadata) {
      metadata = generateSegmentationMetadata('Unnamed Segment');
      segmentIndex = labelmap3D.activeSegmentIndex;

      segmentationModule.setters.metadata(
        element,
        activeLabelmapIndex,
        segmentIndex,
        metadata,
        samplePixelData
      );

      const updated2dMaps = this.getUpdatedSegments(segmentation);
      console.log({
        updated2dMaps,
      });

      labelMap2d.labelmap3D.labelmaps2D = updated2dMaps;

      console.log({ labelMap2d });
      segmentationModule.setters.updateSegmentsOnLabelmap2D(labelMap2d);

      console.log({
        updatedLm2d: segmentationModule.getters.labelmap2D(element),
      });

      refreshViewports();
      triggerEvent(element, 'peppermintautosegmentgenerationevent', {});
    }
  }

  async onImportButtonClick() {
    console.log('import segmentation');
    const segmentation = this.selectSegmentation({
      key: this.state.selectedSegmentation,
      segmentations: this.state.segmentations,
    });
    console.log('start import', {
      // samplePixelData,
      segmentation,
    });
    this.setState({ importing: true });

    const view_ports = cornerstone.getEnabledElements();
    const viewports = view_ports[0];

    // setting active viewport reference to element variable
    const element = getEnabledElement(view_ports.indexOf(viewports));
    if (!element) {
      return;
    }
    this.importSegmentation({
      element,
      segmentation: segmentation, //new Uint8Array(segmentation),
    });
    return;
  }


  /**
   * _hasExistingMaskData - Check if we either have an import
   *                        (quicker to check), or we have some data.
   *
   * @returns {boolean}  Whether mask data exists.
   */
  _hasExistingMaskData(firstImageId) {
    if (segmentationModule.getters.importMetadata(firstImageId)) {
      return true;
    }

    const brushStackState = segmentationModule.state.series[firstImageId];

    if (!brushStackState) {
      return false;
    }

    const labelmap3D =
      brushStackState.labelmaps3D[brushStackState.activeLabelmapIndex];

    if (!labelmap3D) {
      return false;
    }

    return labelmap3D.metadata.some(data => data !== undefined);
  }

  /**
   * componentWillUnmount - If any promises are active, cancel them to avoid
   * memory leakage by referencing `this`.
   *
   * @returns {null}
   */
  componentWillUnmount() {
    const cancelablePromises = this._cancelablePromises;

    for (let i = 0; i < cancelablePromises.length; i++) {
      if (typeof cancelablePromises[i].cancel === 'function') {
        cancelablePromises[i].cancel();
      }
    }
  }

  /**
   * _updateImportingText - Updates the progressText state.
   *
   * @param  {string} roiCollectionLabel The label of the ROI Collection.
   * @returns {null}
   */
  _updateImportingText(roiCollectionLabel) {
    this.setState({
      progressText: roiCollectionLabel,
    });
  }

  /**
   * _collectionEligibleForImport - Returns true if the roiCollection references
   * the active series, and hasn't already been imported.
   *
   * @param  {Object} collectionInfoJSON  An object containing information about
   *                                      the collection.
   * @returns {boolean}                    Whether the collection is eligible
   *                                      for import.
   */
  _collectionEligibleForImport(collectionInfoJSON) {
    const item = collectionInfoJSON.items[0];

    const collectionType = item.data_fields.collectionType;

    if (!this._validTypes.some(type => type === collectionType)) {
      return false;
    }

    return true;
  }

  render() {
    const {
      importing,
    } = this.state;


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
          {importing
            ? null
            : this.state.selectedSegmentation && (
                <div>
                  <button onClick={this.onImportButtonClick}>
                    <Icon name="xnat-import" />
                    Import selected
                  </button>
                </div>
              )}
        </div>
      </div>
    );
  }
}

import React from 'react';
import DICOMSEGWriter from '../../utils/IO/classes/DICOMSEGWriter';
import DICOMSEGExporter from '../../utils/IO/classes/DICOMSEGExporter.js';
import cornerstoneTools from 'cornerstone-tools';
import getSeriesInfoForImageId from '../../utils/IO/helpers/getSeriesInfoForImageId';
import generateDateTimeAndLabel from '../../utils/IO/helpers/generateDateAndTimeLabel';
import SegmentationExportListItem from './SegmentationExportListItem.js';
import getElementForFirstImageId from '../../utils/getElementFromFirstImageId';
import { Icon } from '@ohif/ui';
import { removeEmptyLabelmaps2D } from '../../peppermint-tools';
import showNotification from '../common/showNotification';
import { clearCachedExperimentRoiCollections } from '../../utils/IO/queryXnatRois';
import { connect } from 'react-redux';
import Zlib from 'react-zlib-js';

import '../XNATRoiPanel.styl';
import { client } from '../../../../../platform/viewer/src/appExtensions/LungModuleSimilarityPanel/utils';
// import zlib from 'react-zlib-js';

const segmentationModule = cornerstoneTools.getModule('segmentation');

class XNATSegmentationExportMenu extends React.Component {
  constructor(props = {}) {
    super(props);

    console.log({ props });

    this._cancelablePromises = [];

    const { dateTime, label } = generateDateTimeAndLabel('SEG');

    this.state = {
      segList: [],
      label,
      dateTime,
      exporting: false,
    };

    this.onCloseButtonClick = this.onCloseButtonClick.bind(this);
    this.onTextInputChange = this.onTextInputChange.bind(this);
    this.onExportButtonClick = this.onExportButtonClick.bind(this);
  }

  /**
   * onTextInputChange - Updates the roiCollectionName on text input.
   *
   * @param  {Object} evt The event.
   * @returns {null}
   */
  onTextInputChange(evt) {
    this._roiCollectionName = evt.target.value;
  }

  /**
   * async onExportButtonClick - Exports the current mask to XNAT.
   *
   * @returns {null}
   */
  // async onExportButtonClick() {
  //   const { label } = this.state;
  //   const { firstImageId, viewportData } = this.props;
  //   const roiCollectionName = this._roiCollectionName;

  //   // Check the name isn't empty, and isn't just whitespace.
  //   if (roiCollectionName.replace(/ /g, '').length === 0) {
  //     return;
  //   }

  //   this.setState({ exporting: true });

  //   const seriesInfo = getSeriesInfoForImageId(viewportData);
  //   const element = getElementForFirstImageId(firstImageId);

  //   const xnat_label = `${label}_S${seriesInfo.seriesNumber}`;

  //   // DICOM-SEG
  //   const dicomSegWriter = new DICOMSEGWriter(seriesInfo);
  //   const DICOMSegPromise = dicomSegWriter.write(roiCollectionName, element);

  //   console.log({ label, firstImageId, viewportData, xnat_label, DICOMSegPromise });
  //   DICOMSegPromise.then(segBlob => {
  //     const dicomSegExporter = new DICOMSEGExporter(
  //       segBlob,
  //       seriesInfo.seriesInstanceUid,
  //       xnat_label,
  //       roiCollectionName
  //       );

  //     dicomSegExporter
  //       .exportToXNAT()
  //       .then(success => {
  //         console.log('PUT successful.');
  //         // Store that we've 'imported' a collection for this series.
  //         // (For all intents and purposes exporting it ends with an imported state,
  //         // i.e. not a fresh Mask collection.)

  //         segmentationModule.setters.importMetadata(firstImageId, {
  //           label: xnat_label,
  //           name: roiCollectionName,
  //           type: 'SEG',
  //           modified: false,
  //         });

  //         clearCachedExperimentRoiCollections(dicomSegExporter.experimentID);
  //         showNotification('Mask collection exported successfully', 'success');

  //         this.props.onExportComplete();
  //       })
  //       .catch(error => {
  //         console.log({error});
  //         // TODO -> Work on backup mechanism, disabled for now.
  //         //localBackup.saveBackUpForActiveSeries();

  //         const message = error.message || 'Unknown error';
  //         showNotification(message, 'error', 'Error exporting mask collection');

  //         this.props.onExportCancel();
  //       });
  //   }).catch(error => {
  //     const message = error.message || 'Unknown error';
  //     showNotification(message, 'error', 'Error exporting mask collection');

  //     this.props.onExportCancel();
  //   });
  // }

  createSeg() {
    const element = document.getElementsByClassName('viewport-element')[0];
    console.log({ element });
    const globalToolStateManager =
      cornerstoneTools.globalImageIdSpecificToolStateManager;
    const toolState = globalToolStateManager.saveToolState();

    const stackToolState = cornerstoneTools.getToolState(element, 'stack');
    //  const imageIds = stackToolState.data[0].imageIds;
    // imageIds.push(
    //   'dicomweb://s3.amazonaws.com/lury/PTCTStudy/1.3.6.1.4.1.25403.52237031786.3872.20100510032220.12.dcm'
    // );
    const imageIds = [
      'dicomweb://s3.amazonaws.com/lury/PTCTStudy/1.3.6.1.4.1.25403.52237031786.3872.20100510032220.11.dcm',
      'dicomweb://s3.amazonaws.com/lury/PTCTStudy/1.3.6.1.4.1.25403.52237031786.3872.20100510032220.12.dcm',
    ];
    console.log({ toolState, stackToolState, imageIds });

    let imagePromises = [];
    for (let i = 0; i < imageIds.length; i++) {
      imagePromises.push(cornerstone.loadImage(imageIds[i]));
    }

    console.log({ imagePromises });

    const segments = [];

    const { getters } = cornerstoneTools.getModule('segmentation');
    const { labelmaps3D } = getters.labelmaps3D(element);

    console.log({ segments, labelmaps3D });

    if (!labelmaps3D) {
      return;
    }

    for (
      let labelmapIndex = 0;
      labelmapIndex < labelmaps3D.length;
      labelmapIndex++
    ) {
      const labelmap3D = labelmaps3D[labelmapIndex];
      const labelmaps2D = labelmap3D.labelmaps2D;

      for (let i = 0; i < labelmaps2D.length; i++) {
        if (!labelmaps2D[i]) {
          continue;
        }

        const segmentsOnLabelmap = labelmaps2D[i].segmentsOnLabelmap;

        segmentsOnLabelmap.forEach(segmentIndex => {
          if (segmentIndex !== 0 && !labelmap3D.metadata[segmentIndex]) {
            labelmap3D.metadata[segmentIndex] = generateMockMetadata(
              segmentIndex
            );
          }
        });
      }
    }

    Promise.all(imagePromises)
      .then(async images => {
        console.log({ images });
        const segBlob = dcmjs.adapters.Cornerstone.Segmentation.generateSegmentation(
          images,
          labelmaps3D
        );
        console.log({ segBlob });

        //Create a URL for the binary.
        // await localStorage.setItem(
        //   'segBlob',
        //   JSON.stringify({ blob: segBlob })
        // );
        var objectUrl = URL.createObjectURL(segBlob);
        window.open(objectUrl);
      })
      .catch(err => console.log(err));
  }

  handleSegmentationCompression(seg) {
    return new Promise((res, rej) => {
      Zlib.gzip(JSON.stringify(seg), (err, result) => {
        console.log({ err, result });

        if (err) return rej(err);

        res(result);
      });
    });
  }

  async saveSegmentation({ element, segmentation }) {
    try {
      console.log('saving', this.props);
      const series_uid = this.props.viewport.viewportSpecificData[0]
        .SeriesInstanceUID;
      const study_uid = this.props.viewport.viewportSpecificData[0]
        .StudyInstanceUID;
      const email = this.props.user.profile.email;

      const compressed = await this.handleSegmentationCompression(segmentation);
      console.log({ compressed });

      // get current image
      const image = cornerstone.getImage(element);
      // extract instance uid from the derived image data
      const instance_uid = image.imageId.split('/')[18];
      console.log({ instance_uid, study_uid, series_uid });

      const body = {
        study_uid: study_uid,
        // series_uid: series_uid,
        email: 'bimpongamoako@gmail.com', //'nick.fragakis@thetatech.ai',
        // instance_uid,
        segmentation: compressed,
        label: 'label',
      };

      console.log({ payload: body });

      await client
        .put(`/segmentations`, body)
        .then(async response => {
          console.log({ response });
        })
        .catch(error => {
          console.log(error);
        });
    } catch (error) {
      console.log({ error });
    }
  }

  exportToLocalStorage(element) {
    console.log({ segmentationModule });
    const labelmap2D = segmentationModule.getters.labelmap2D(element);
    console.log({ labelmap2D });
    // const metaData = segmentationModule.getters.metaData(
    //   element,
    //   labelmap2D.activeLabelmapIndex,
    //   labelmap2D.segmentIndex
    // );
    const metaData =
      labelmap2D.labelmap3D.metadata[labelmap2D.activeLabelmapIndex + 1];
    const stringified = JSON.stringify(labelmap2D.labelmap2D.pixelData);
    const parsed = JSON.parse(stringified);
    const arr = Object.keys(parsed).map(key => {
      return parsed[key];
    });

    console.log({
      metaData,
      labelmap2D,
      parsed,
      stringified,
      arr,
    });

    this.saveSegmentation({
      element,
      segmentation: labelmap2D.labelmap2D.pixelData,
    });

    // localStorage.setItem(
    //   'segmentationExports',
    //   JSON.stringify({
    //     pixelData: labelmap2D.labelmap2D.pixelData,
    //   })
    // );
  }

  async onExportButtonClick() {
    // this.createSeg();
    // return;
    const { label } = this.state;
    const { firstImageId, viewportData } = this.props;
    const roiCollectionName = this._roiCollectionName;

    // console.log({ MaskExportClickState: this.state });
    // console.log({ MaskExportClickProps: this.props });

    // Check the name isn't empty, and isn't just whitespace.
    if (roiCollectionName.replace(/ /g, '').length === 0) {
      return;
    }

    this.setState({ exporting: true });

    const seriesInfo = getSeriesInfoForImageId(viewportData);
    const element = getElementForFirstImageId(firstImageId);

    console.log({ segmentationModule });

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


    // this.exportToLocalStorage(element);
    return;

    const xnat_label = `${label}_S${seriesInfo.SeriesNumber}`;

    // console.log({ pixelData: this.props.labelmap3D.labelmaps2D[0].pixelData });

    // console.log({ seriesInfo, ExportProps: this.props, State: this.state });

    // get current image
    const image = cornerstone.getImage(element);
    // console.log({ image });

    // const toolState = cornerstoneTools.getElementToolStateManager(element);

    const toolState = cornerstoneTools.getToolState(element, 'stack');
    console.log({ image, toolState });

    const segments = this.props.labelmap3D.labelmaps2D;

    const newImage = {
      height: image.height,
      width: image.width,
      number_of_slices: toolState.data[0].imageIds.length,
    };

    const revampSengmentations = segments.filter((segment, index) => {
      if (segment === null) {
        return;
      } else {
        segment.sliceNumber = index;
        return segment;
      }
    });

    const maskExport = {
      image: newImage,
      study_uid: seriesInfo.studyInstanceUid,
      series_uid: seriesInfo.seriesInstanceUid,
      labelSegments: revampSengmentations,
    };

    console.log({ maskExport });

    showNotification('Mask collection exported successfully', 'success');

    this.props.onExportComplete();
  }

  /**
   * onCloseButtonClick - Closes the dialog.
   *
   * @returns {null}
   */
  onCloseButtonClick() {
    this.props.onExportCancel();
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
   * componentDidMount - On mount, fetch a list of available projects from XNAT.
   *
   * @returns {null}
   */
  componentDidMount() {
    console.log({ props: this.props });

    const { firstImageId } = this.props;
    const element = getElementForFirstImageId(firstImageId);
    const {
      labelmaps3D,
      activeLabelmapIndex,
    } = segmentationModule.getters.labelmaps3D(element);

    if (!labelmaps3D) {
      return;
    }

    const labelmap3D = labelmaps3D[activeLabelmapIndex];

    if (!firstImageId || !labelmap3D) {
      return;
    }

    removeEmptyLabelmaps2D(labelmap3D);

    const importMetadata = segmentationModule.setters.importMetadata(
      firstImageId
    );

    const metadata = labelmap3D.metadata;

    if (!metadata) {
      return;
    }
    const segList = [];

    for (let i = 0; i < metadata.length; i++) {
      if (metadata[i]) {
        // Check if the segment has labelmap data
        const hasData = labelmap3D.labelmaps2D.some(labelmap2D => {
          return labelmap2D.segmentsOnLabelmap.includes(i);
        });
        if (hasData) {
          segList.push({
            index: i,
            metadata: metadata[i],
          });
        }
      }
    }

    let defaultName = '';

    if (segList && segList.length === 1) {
      defaultName = segList[0].metadata.SegmentLabel;
    }

    this._roiCollectionName = defaultName;

    this.setState({ segList, importMetadata });
  }

  render() {
    const { label, segList, exporting, importMetadata } = this.state;

    let segExportListBody;

    let defaultName = '';

    if (segList && segList.length === 1) {
      defaultName = segList[0].metadata.SegmentLabel;
    }

    const emptySegList = segList.length === 0;

    if (emptySegList) {
      segExportListBody = (
        <>
          <h5>Empty segments data. Export is no available.</h5>
        </>
      );
    } else if (exporting) {
      segExportListBody = (
        <>
          <h5>
            exporting {this._roiCollectionName}
            ...
          </h5>
        </>
      );
    } else {
      segExportListBody = (
        <table className="collectionTable">
          <tbody>
            {importMetadata ? (
              <tr className="mask-export-list-collection-info">
                <th className="left-aligned-cell">{importMetadata.name}</th>
                <th className="centered-cell">{importMetadata.label}</th>
                <th className="right-aligned-cell">{importMetadata.type}</th>
              </tr>
            ) : (
              <tr className="mask-export-list-collection-info">
                <th colSpan="3" className="left-aligned-cell">
                  New Mask Collection
                </th>
              </tr>
            )}

            <tr>
              <th>Label</th>
              <th className="centered-cell">Category</th>
              <th className="centered-cell">Type</th>
            </tr>
            {segList.map(segment => (
              <SegmentationExportListItem
                key={segment.index}
                segIndex={segment.index}
                metadata={segment.metadata}
              />
            ))}
          </tbody>
        </table>
      );
    }

    return (
      <div className="xnatPanel">
        <div className="panelHeader">
          <h3>Export mask-based ROI collection</h3>
          {!exporting && (
            <button className="small" onClick={this.onCloseButtonClick}>
              <Icon name="xnat-cancel" />
            </button>
          )}
        </div>

        <div className="roiCollectionBody limitHeight">{segExportListBody}</div>

        {!exporting && !emptySegList && (
          <div className="roiCollectionFooter">
            <div>
              <label style={{ marginRight: 5 }}>Name</label>
              <input
                name="segBuilderTextInput"
                onChange={this.onTextInputChange}
                type="text"
                defaultValue={defaultName}
                tabIndex="-1"
                autoComplete="off"
                style={{ flex: 1 }}
              />
            </div>
            <button
              onClick={this.onExportButtonClick}
              style={{ marginLeft: 10 }}
            >
              <Icon name="xnat-export" />
              Export
            </button>
          </div>
        )}
      </div>
    );
  }
}

const mapStateToProps = state => {
  return {
    user: state.oidc.user,
    viewport: state.viewports,
  };
};

const ConnectedExportMenu = connect(
  mapStateToProps,
  null
)(XNATSegmentationExportMenu);

export default ConnectedExportMenu;

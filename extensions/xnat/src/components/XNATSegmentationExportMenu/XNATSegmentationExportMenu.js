import React from 'react';
import cornerstoneTools from 'cornerstone-tools';
import getSeriesInfoForImageId from '../../utils/IO/helpers/getSeriesInfoForImageId';
import generateDateTimeAndLabel from '../../utils/IO/helpers/generateDateAndTimeLabel';
import SegmentationExportListItem from './SegmentationExportListItem.js';
import getElementForFirstImageId from '../../utils/getElementFromFirstImageId';
import { Icon } from '@ohif/ui';
import { removeEmptyLabelmaps2D } from '../../peppermint-tools';
import { connect } from 'react-redux';
import Zlib from 'react-zlib-js';

import '../XNATRoiPanel.styl';
import {
  client,
  compressSeg,
  getSegArray,
  getSplitSegArray,
} from '../../../../../platform/viewer/src/appExtensions/LungModuleSimilarityPanel/utils';
import { radcadapi } from '@ohif/viewer/src/utils/constants';
import { setItem } from '@ohif/viewer/src/lib/localStorageUtils';

const segmentationModule = cornerstoneTools.getModule('segmentation');

class XNATSegmentationExportMenu extends React.Component {
  constructor(props = {}) {
    super(props);

    console.log({ props });

    const { dateTime, label } = generateDateTimeAndLabel('SEG');

    this.state = {
      segList: [],
      label,
      dateTime,
      exporting: false,
    };
  }

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

    this.handleExportSegmentations(segList);
  }

  // handleSegmentationCompression(seg) {
  //   return new Promise((res, rej) => {
  //     Zlib.gzip(JSON.stringify(seg), (err, result) => {
  //       console.log({ err, result });

  //       if (err) return rej(err);

  //       res(result);
  //     });
  //   });
  // }

  updateAndSaveLocalSegmentations(b) {
    console.log({ b });
    const fetchedSegmentationsList = localStorage.getItem('segmentation');
    console.log({
      fetchedSegmentationsList,
    });
    const segmentationsList =
      fetchedSegmentationsList && fetchedSegmentationsList !== 'undefined'
        ? JSON.parse(fetchedSegmentationsList)
        : {};

    segmentationsList[b.label] = {
      segmentation: b.segmentation,
      label: b.label,
      shape: b.shape,
    };
    console.log({ segmentationsList });

    localStorage.setItem('segmentation', JSON.stringify(segmentationsList));
  }

  saveSegmentation({ segmentation, shape, label }) {
    return new Promise(async (res, rej) => {
      try {
        console.log('saving', this.props);
        const series_uid = this.props.viewport.viewportSpecificData[0]
          .SeriesInstanceUID;
        const email = this.props.user.profile.email;

        console.log({ segmentation });

        const body = {
          series_uid: series_uid,
          email,
          segmentation,
          shape,
          label,
        };

        console.log({ payload: body, str: JSON.stringify(body) });

        var requestOptions = {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            // Authorization: 'Bearer ' + state.oidc.user.access_token,
          },
          body: JSON.stringify(body),
        };

        let response = await fetch(
          `${radcadapi}/segmentations`,
          requestOptions
        );

        response = await response.json();

        // await client
        //   .put(`/segmentations`, body)
        //   .then(async response => {
        //     console.log({ response });
        //     this.updateAndSaveLocalSegmentations(body);
        res({ response });
        //   })
        //   .catch(error => {
        //     console.log(error);
        //   });
      } catch (error) {
        console.log({ error });
      }
    });
  }

  async saveExportations({ element, segList }) {
    return new Promise(async (res, rej) => {
      console.log({ segList });
      const imagePlaneModule =
        cornerstone.metaData.get('imagePlaneModule', this.props.firstImageId) ||
        {};
      const { rows, columns } = imagePlaneModule;
      const numSlices = this.props.viewport.viewportSpecificData['0']
        .numImageFrames;
      const labelmap2D = segmentationModule.getters.labelmap2D(element);
      const shape = {
        slices: numSlices,
        rows: rows,
        cols: columns,
      };

      //improvement: we dont need to flatten the data do we?
      const segArray = getSegArray({
        segmentations: labelmap2D.labelmap3D.labelmaps2D,
        numSlices,
        rows,
        columns,
      });
      console.log({ segArray });

      const segmentations = {};

      const asyncSaveSegs = segList.map((item, index) => {
        return () =>
          new Promise(async (resolve, reject) => {
            console.warn('asyncSaveSegs', { item, index });

            const splitSegArray = getSplitSegArray({
              flatSegmentationArray: segArray,
              index: item.index,
            });

            console.log({
              item,
              index,
              splitSegArray,
            });

            const compressedSeg = await compressSeg(splitSegArray);
            console.log({
              compressedSeg,
            });

            const response = await this.saveSegmentation({
              segmentation: compressedSeg,
              label: item.metadata.SegmentLabel,
              shape,
            });
            console.log({
              response,
            });

            resolve(response);
          });
      });

      console.log({ asyncSaveSegs });
      console.log({ segmentations });

      const resList = [];

      for (const fn of asyncSaveSegs) {
        const response = await fn();
        resList.push(response);
      }

      console.warn({ resList });
      res({
        ['exportation complete']: resList,
      });
    });
  }

  async handleExportSegmentations(segList) {
    const { label } = this.state;
    const { firstImageId, viewportData } = this.props;

    this.setState({ exporting: true });

    const seriesInfo = getSeriesInfoForImageId(viewportData);
    const element = getElementForFirstImageId(firstImageId);

    console.log({
      segmentationModule,
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

    try {
      const response = await this.saveExportations({
        element,
        segList: segList ? segList : this.state.segList,
      });
      console.warn({ response });
    } catch (error) {}
    setItem('hasUnsavedChanges', false);

    this.setState({
      exporting: false,
    });
    this.props.onExportCancel();

    return;
  }

  onCloseButtonClick() {
    this.props.onExportCancel();
  }

  render() {
    const { label, segList, exporting, importMetadata } = this.state;

    let segExportListBody;

    // if (segList && segList.length === 1) {
    //   defaultName = segList[0].metadata.SegmentLabel;
    // }

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
          <h5>exporting segmentations. Please wait...</h5>
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
            <button
              // id="triggerExportSegmentations"
              onClick={this.handleExportSegmentations}
              style={{ marginLeft: 10, display: 'none' }}
            >
              <Icon name="xnat-export" />
              Export4
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

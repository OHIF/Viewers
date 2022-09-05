import React from 'react';
import cornerstoneTools from 'cornerstone-tools';
import { getEnabledElement } from '../../../../cornerstone/src/state';
import { Icon } from '@ohif/ui';
import '../XNATRoiPanel.styl';
import { generateSegmentationMetadata } from '../../peppermint-tools';
import { triggerEvent } from 'cornerstone-core';
import refreshViewports from '../../../../dicom-segmentation/src/utils/refreshViewports';
import { connect } from 'react-redux';
import {
  client,
  getUpdatedSegments,
  uncompress,
} from '../../../../../platform/viewer/src/appExtensions/LungModuleSimilarityPanel/utils';
import List, {
  ListItem,
} from '../../../../../platform/viewer/src/appExtensions/LungModuleSimilarityPanel/components/list';

const segmentationModule = cornerstoneTools.getModule('segmentation');

class XNATSegmentationImportMenu extends React.Component {
  constructor(props = {}) {
    super(props);

    this.state = {
      importListReady: false,
      importing: false,
      progressText: '',
      importProgress: 0,
      segmentations: {},
      selectedSegmentation: '',
    };
  }

  componentDidMount() {
    console.log('import onmount');

    //  this.fetchSegmentationsFromLocalStorage();
    this.onImportButtonClick();
  }

  getSegmentationName(key) {
    return key.split('-').join(' ');
  }

  onCloseButtonClick() {
    this.props.onImportCancel();
  }

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
    } else {
      //theres something on this layer so we need to find the last layer and work on the one after it
      console.warn('layer occupied', labelmap3D);

      metadata = generateSegmentationMetadata(label);
      segmentIndex = labelmap3D.metadata.length;

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
    }
  }

  importSegmentationLayers({ segmentations }) {
    const segmentationsList = Object.keys(segmentations);
    console.log({ segmentationsList });

    const view_ports = cornerstone.getEnabledElements();
    const viewports = view_ports[0];

    const element = getEnabledElement(view_ports.indexOf(viewports));

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

      if (!element) {
        return;
      }

      console.warn({
        uncompressed,
        item,
      });

      this.addSegmentationToCanvas({
        segmentation: uncompressed,
        label: item,
        element,
      });
    });

    console.log('refresh viewports', {});
    refreshViewports();
    triggerEvent(element, 'peppermintautosegmentgenerationevent', {});
  }

  fetchSegmentationsFromLocalStorage() {
    try {
      const segmentationsJson = localStorage.getItem('segmentation');
      console.log({ segmentationsJson });
      const segmentations =
        segmentationsJson && segmentationsJson !== 'undefined'
          ? JSON.parse(segmentationsJson)
          : {};
      return segmentations;
    } catch (error) {
      console.log({ error });
    }
  }

  fetchSegmentations() {
    return new Promise(async (res, rej) => {
      try {
        console.log('fetch segmentation', this.props);
        const series_uid = this.props.viewportData.SeriesInstanceUID;
        // const email = 'nick.fragakis%40thetatech.ai';
        const email = this.props.user.profile.email;

        console.log({ series_uid });

        const body = {
          email: 'bimpongamoako@gmail.com', //'nick.fragakis@thetatech.ai',
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

  async onImportButtonClick() {
    //  const segmentations = this.fetchSegmentationsFromLocalStorage();
    const segmentations = await this.fetchSegmentations();
    console.log({ segmentations });
    this.importSegmentationLayers({
      segmentations,
    });
    return;
  }

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
            <p>Importing Segmentations. Please wait...</p>
          )}
        </div>
        <div className="roiCollectionFooter"></div>
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

const ConnectedImportMenu = connect(
  mapStateToProps,
  null
)(XNATSegmentationImportMenu);

export default ConnectedImportMenu;

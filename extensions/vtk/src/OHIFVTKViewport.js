import React, { Component } from 'react';
import { getImageData, loadImageData } from 'react-vtkjs-viewport';

import ConnectedVTKViewport from './ConnectedVTKViewport';
import LoadingIndicator from './LoadingIndicator.js';
import OHIF from '@ohif/core';
import PropTypes from 'prop-types';
import cornerstone from 'cornerstone-core';
import handleSegmentationStorage from './handleSegmentationStorage.js';
import vtkDataArray from 'vtk.js/Sources/Common/Core/DataArray';
import vtkImageData from 'vtk.js/Sources/Common/DataModel/ImageData';
import vtkVolume from 'vtk.js/Sources/Rendering/Core/Volume';
import vtkVolumeMapper from 'vtk.js/Sources/Rendering/Core/VolumeMapper';

const { StackManager } = OHIF.utils;

// Metadata configuration
const metadataProvider = new OHIF.cornerstone.MetadataProvider();

cornerstone.metaData.addProvider(
  metadataProvider.provider.bind(metadataProvider)
);

StackManager.setMetadataProvider(metadataProvider);

const SOP_CLASSES = {
  SEGMENTATION_STORAGE: '1.2.840.10008.5.1.4.1.1.66.4',
};

const specialCaseHandlers = {};
specialCaseHandlers[
  SOP_CLASSES.SEGMENTATION_STORAGE
] = handleSegmentationStorage;

// TODO: Figure out where we plan to put this long term
const volumeCache = {};

/**
 * Create a labelmap image with the same dimensions as our background volume.
 *
 * @param backgroundImageData vtkImageData
 */
function createLabelMapImageData(backgroundImageData) {
  const labelMapData = vtkImageData.newInstance(
    backgroundImageData.get('spacing', 'origin', 'direction')
  );
  labelMapData.setDimensions(backgroundImageData.getDimensions());
  labelMapData.computeTransforms();

  const values = new Uint8Array(backgroundImageData.getNumberOfPoints());
  const dataArray = vtkDataArray.newInstance({
    numberOfComponents: 1, // labelmap with single component
    values,
  });
  labelMapData.getPointData().setScalars(dataArray);

  return labelMapData;
}

class OHIFVTKViewport extends Component {
  state = {
    volumes: null,
    paintFilterLabelMapImageData: null,
    paintFilterBackgroundImageData: null,
  };

  static propTypes = {
    viewportData: PropTypes.shape({
      studies: PropTypes.array,
      displaySet: PropTypes.shape({
        studyInstanceUid: PropTypes.string,
        displaySetInstanceUid: PropTypes.string,
        sopClassUids: PropTypes.arrayOf(PropTypes.string),
        sopInstanceUid: PropTypes.string,
        frameIndex: PropTypes.number,
      }),
    }),
    viewportIndex: PropTypes.number,
    children: PropTypes.node,
    onScroll: PropTypes.func,
  };

  static defaultProps = {
    onScroll: () => {},
  };

  static id = 'OHIFVTKViewport';

  static init() {
    console.log('OHIFVTKViewport init()');
  }

  static destroy() {
    console.log('OHIFVTKViewport destroy()');
    StackManager.clearStacks();
  }

  static getCornerstoneStack(
    studies,
    studyInstanceUid,
    displaySetInstanceUid,
    sopInstanceUid,
    frameIndex
  ) {
    // Create shortcut to displaySet
    const study = studies.find(
      study => study.studyInstanceUid === studyInstanceUid
    );

    const displaySet = study.displaySets.find(set => {
      return set.displaySetInstanceUid === displaySetInstanceUid;
    });

    // Get stack from Stack Manager
    const storedStack = StackManager.findOrCreateStack(study, displaySet);

    // Clone the stack here so we don't mutate it
    const stack = Object.assign({}, storedStack);

    if (frameIndex !== undefined) {
      stack.currentImageIdIndex = frameIndex;
    } else if (sopInstanceUid) {
      const index = stack.imageIds.findIndex(imageId => {
        const sopCommonModule = cornerstone.metaData.get(
          'sopCommonModule',
          imageId
        );
        if (!sopCommonModule) {
          return;
        }

        return sopCommonModule.sopInstanceUID === sopInstanceUid;
      });

      if (index > -1) {
        stack.currentImageIdIndex = index;
      }
    } else {
      stack.currentImageIdIndex = 0;
    }

    return stack;
  }

  getViewportData = (
    studies,
    studyInstanceUid,
    displaySetInstanceUid,
    sopClassUid,
    sopInstanceUid,
    frameIndex
  ) => {
    const stack = OHIFVTKViewport.getCornerstoneStack(
      studies,
      studyInstanceUid,
      displaySetInstanceUid,
      sopClassUid,
      sopInstanceUid,
      frameIndex
    );

    let imageDataObject;
    let labelmapDataObject;

    switch (sopClassUid) {
      case SOP_CLASSES.SEGMENTATION_STORAGE:
        throw new Error('Not yet implemented');
      /*
        const data = handleSegmentationStorage(
          stack.imageIds,
          displaySetInstanceUid
        );

        imageDataObject = data.referenceDataObject;
        labelmapDataObject = data.labelmapDataObject;

        return loadImageData(imageDataObject).then(() => {
          return {
            data: imageDataObject.vtkImageData,
            labelmap: labelmapDataObject,
          };
        });
        */
      default:
        imageDataObject = getImageData(stack.imageIds, displaySetInstanceUid);

        return imageDataObject;
    }
  };

  /**
   *
   *
   * @param {object} imageDataObject
   * @param {object} imageDataObject.vtkImageData
   * @param {object} imageDataObject.imageMetaData0
   * @param {number} [imageDataObject.imageMetaData0.windowWidth] - The volume's initial windowWidth
   * @param {number} [imageDataObject.imageMetaData0.windowCenter] - The volume's initial windowCenter
   * @param {string} imageDataObject.imageMetaData0.modality - CT, MR, PT, etc
   * @param {string} displaySetInstanceUid
   * @returns vtkVolumeActor
   * @memberof OHIFVTKViewport
   */
  getOrCreateVolume(imageDataObject, displaySetInstanceUid) {
    if (volumeCache[displaySetInstanceUid]) {
      return volumeCache[displaySetInstanceUid];
    }

    const { vtkImageData, imageMetaData0 } = imageDataObject;
    const { windowWidth, windowCenter, modality } = imageMetaData0;

    const { lower, upper } = _getRangeFromWindowLevels(
      windowWidth,
      windowCenter,
      modality
    );
    const volumeActor = vtkVolume.newInstance();
    const volumeMapper = vtkVolumeMapper.newInstance();

    volumeActor.setMapper(volumeMapper);
    volumeMapper.setInputData(vtkImageData);

    volumeActor
      .getProperty()
      .getRGBTransferFunction(0)
      .setRange(lower, upper);

    const spacing = vtkImageData.getSpacing();
    // Set the sample distance to half the mean length of one side. This is where the divide by 6 comes from.
    // https://github.com/Kitware/VTK/blob/6b559c65bb90614fb02eb6d1b9e3f0fca3fe4b0b/Rendering/VolumeOpenGL2/vtkSmartVolumeMapper.cxx#L344
    const sampleDistance = (spacing[0] + spacing[1] + spacing[2]) / 6;

    volumeMapper.setSampleDistance(sampleDistance);

    // Be generous to surpress warnings, as the logging really hurts performance.
    // TODO: maybe we should auto adjust samples to 1000.
    volumeMapper.setMaximumSamplesPerRay(4000);

    volumeCache[displaySetInstanceUid] = volumeActor;

    return volumeActor;
  }

  setStateFromProps() {
    const { studies, displaySet } = this.props.viewportData;
    const {
      studyInstanceUid,
      displaySetInstanceUid,
      sopClassUids,
      sopInstanceUid,
      frameIndex,
    } = displaySet;

    if (sopClassUids.length > 1) {
      console.warn(
        'More than one SOPClassUid in the same series is not yet supported.'
      );
    }

    const sopClassUid = sopClassUids[0];
    const imageDataObject = this.getViewportData(
      studies,
      studyInstanceUid,
      displaySetInstanceUid,
      sopClassUid,
      sopInstanceUid,
      frameIndex
    );

    this.imageDataObject = imageDataObject;

    // TODO: Temporarily disabling this since it is not yet
    // being used and hurts performance significantly.
    /*if (!labelmap) {
      labelmap = createLabelMapImageData(data);
    }*/

    const volumeActor = this.getOrCreateVolume(
      imageDataObject,
      displaySetInstanceUid
    );

    this.setState({
      paintFilterBackgroundImageData: imageDataObject.vtkImageData,
      paintFilterLabelMapImageData: null, // TODO
      percentComplete: 0,
    });

    this.setState(
      {
        paintFilterBackgroundImageData: imageDataObject.vtkImageData,
        paintFilterLabelMapImageData: null, // TODO
        percentComplete: 0,
      },
      () => {
        this.loadProgressively(imageDataObject);

        // TODO: There must be a better way to do this.
        // We do this so that if all the data is available the react-vtkjs-viewport
        // Will render _something_ before the volumes are set and the volume
        // Construction that happens in react-vtkjs-viewport locks up the CPU.
        setTimeout(() => {
          this.setState({
            volumes: [volumeActor],
          });
        }, 200);
      }
    );
  }

  componentDidMount() {
    this.setStateFromProps();
  }

  componentDidUpdate(prevProps) {
    const { studies, displaySet } = this.props.viewportData;
    const prevDisplaySet = prevProps.viewportData.displaySet;

    if (
      displaySet.displaySetInstanceUid !==
        prevDisplaySet.displaySetInstanceUid ||
      displaySet.sopInstanceUid !== prevDisplaySet.sopInstanceUid ||
      displaySet.frameIndex !== prevDisplaySet.frameIndex
    ) {
      this.setStateFromProps();
    }
  }

  loadProgressively(imageDataObject) {
    loadImageData(imageDataObject);

    const { isLoading, insertPixelDataPromises } = imageDataObject;

    const numberOfFrames = insertPixelDataPromises.length;

    if (!isLoading) {
      this.setState({ isLoaded: true });
      return;
    }

    insertPixelDataPromises.forEach(promise => {
      promise.then(numberProcessed => {
        const percentComplete = Math.floor(
          (numberProcessed * 100) / numberOfFrames
        );

        if (percentComplete !== this.state.percentComplete) {
          this.setState({
            percentComplete,
          });
        }
      });
    });

    Promise.all(insertPixelDataPromises).then(() => {
      this.setState({ isLoaded: true });
    });
  }

  render() {
    let childrenWithProps = null;

    // TODO: Does it make more sense to use Context?
    if (this.props.children && this.props.children.length) {
      childrenWithProps = this.props.children.map((child, index) => {
        return (
          child &&
          React.cloneElement(child, {
            viewportIndex: this.props.viewportIndex,
            key: index,
          })
        );
      });
    }

    const style = { width: '100%', height: '100%', position: 'relative' };

    return (
      <>
        <div style={style}>
          {!this.state.isLoaded && (
            <LoadingIndicator percentComplete={this.state.percentComplete} />
          )}
          {this.state.volumes && (
            <ConnectedVTKViewport
              volumes={this.state.volumes}
              paintFilterLabelMapImageData={
                this.state.paintFilterLabelMapImageData
              }
              paintFilterBackgroundImageData={
                this.state.paintFilterBackgroundImageData
              }
              viewportIndex={this.props.viewportIndex}
              onScroll={this.props.onScroll}
            />
          )}
        </div>
        )}
        {childrenWithProps}
      </>
    );
  }
}

/**
 * Takes window levels and converts them to a range (lower/upper)
 * for use with VTK RGBTransferFunction
 *
 * @private
 * @param {number} [width] - the width of our window
 * @param {number} [center] - the center of our window
 * @param {string} [modality] - 'PT', 'CT', etc.
 * @returns { lower, upper } - range
 */
function _getRangeFromWindowLevels(width, center, modality = undefined) {
  const levelsAreNotNumbers = isNaN(center) || isNaN(width);

  if (levelsAreNotNumbers) {
    return { lower: 0, upper: 512 };
  }

  // For PET just set the range to 0-5 SUV
  if (modality === 'PT') {
    return { lower: 0, upper: 5 };
  }

  return {
    lower: center - width / 2.0,
    upper: center + width / 2.0,
  };
}

export default OHIFVTKViewport;

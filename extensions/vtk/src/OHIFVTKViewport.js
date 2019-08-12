import React, { Component } from "react";
import { getImageData, loadImageData } from "react-vtkjs-viewport";

import ConnectedVTKViewport from "./ConnectedVTKViewport";
import LoadingIndicator from "./LoadingIndicator.js";
import OHIF from "@ohif/core";
import PropTypes from "prop-types";
import cornerstone from "cornerstone-core";
import handleSegmentationStorage from "./handleSegmentationStorage.js";
import vtkDataArray from "vtk.js/Sources/Common/Core/DataArray";
import vtkImageData from "vtk.js/Sources/Common/DataModel/ImageData";
import vtkVolume from "vtk.js/Sources/Rendering/Core/Volume";
import vtkVolumeMapper from "vtk.js/Sources/Rendering/Core/VolumeMapper";

const { StackManager } = OHIF.utils;

// Metadata configuration
const metadataProvider = new OHIF.cornerstone.MetadataProvider();

cornerstone.metaData.addProvider(
  metadataProvider.provider.bind(metadataProvider)
);

StackManager.setMetadataProvider(metadataProvider);

const SOP_CLASSES = {
  SEGMENTATION_STORAGE: "1.2.840.10008.5.1.4.1.1.66.4"
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
    backgroundImageData.get("spacing", "origin", "direction")
  );
  labelMapData.setDimensions(backgroundImageData.getDimensions());
  labelMapData.computeTransforms();

  const values = new Uint8Array(backgroundImageData.getNumberOfPoints());
  const dataArray = vtkDataArray.newInstance({
    numberOfComponents: 1, // labelmap with single component
    values
  });
  labelMapData.getPointData().setScalars(dataArray);

  return labelMapData;
}

class OHIFVTKViewport extends Component {
  state = {
    volumes: null,
    paintFilterLabelMapImageData: null,
    paintFilterBackgroundImageData: null
  };

  static propTypes = {
    studies: PropTypes.object,
    displaySet: PropTypes.object,
    viewportIndex: PropTypes.number,
    children: PropTypes.node
  };

  static id = "OHIFVTKViewport";

  static init() {
    console.log("OHIFVTKViewport init()");
  }

  static destroy() {
    console.log("OHIFVTKViewport destroy()");
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
          "sopCommonModule",
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
        throw new Error("Not yet implemented");

        const data = handleSegmentationStorage(
          stack.imageIds,
          displaySetInstanceUid
        );

        imageDataObject = data.referenceDataObject;
        labelmapDataObject = data.labelmapDataObject;

        return loadImageData(imageDataObject).then(() => {
          return {
            data: imageDataObject.vtkImageData,
            labelmap: labelmapDataObject
          };
        });
      default:
        imageDataObject = getImageData(stack.imageIds, displaySetInstanceUid);

        return loadImageData(imageDataObject).then(() => {
          return {
            data: imageDataObject.vtkImageData
          };
        });
    }
  };

  getOrCreateVolume(data, displaySetInstanceUid) {
    if (volumeCache[displaySetInstanceUid]) {
      return volumeCache[displaySetInstanceUid];
    }

    const volumeActor = vtkVolume.newInstance();
    const volumeMapper = vtkVolumeMapper.newInstance();

    volumeActor.setMapper(volumeMapper);
    volumeMapper.setInputData(data);

    // TODO: Should look into implementing autoAdjustSampleDistance in vtk
    const sampleDistance =
      1.2 *
      Math.sqrt(
        data
          .getSpacing()
          .map((v) => v * v)
          .reduce((a, b) => a + b, 0)
      );

    volumeMapper.setSampleDistance(sampleDistance);

    volumeCache[displaySetInstanceUid] = volumeActor;

    return volumeActor;
  }

  async setStateFromProps() {
    const { studies, displaySet } = this.props.viewportData;
    const {
      studyInstanceUid,
      displaySetInstanceUid,
      sopClassUids,
      sopInstanceUid,
      frameIndex
    } = displaySet;

    if (sopClassUids.length > 1) {
      console.warn(
        "More than one SOPClassUid in the same series is not yet supported."
      );
    }

    const sopClassUid = sopClassUids[0];

    let { data, labelmap } = await this.getViewportData(
      studies,
      studyInstanceUid,
      displaySetInstanceUid,
      sopClassUid,
      sopInstanceUid,
      frameIndex
    );

    if (!labelmap) {
      labelmap = createLabelMapImageData(data);
    }

    const volumeActor = this.getOrCreateVolume(data, displaySetInstanceUid);

    this.setState({
      volumes: [volumeActor],
      paintFilterBackgroundImageData: data,
      paintFilterLabelMapImageData: labelmap
    });
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

  render() {
    let childrenWithProps = null;

    // TODO: Does it make more sense to use Context?
    if (this.props.children && this.props.children.length) {
      childrenWithProps = this.props.children.map((child, index) => {
        return React.cloneElement(child, {
          viewportIndex: this.props.viewportIndex,
          key: index
        });
      });
    }

    const style = { width: "100%", height: "100%", position: "relative" };

    return (
      <>
        {this.state.volumes ? (
          <ConnectedVTKViewport
            volumes={this.state.volumes}
            paintFilterLabelMapImageData={
              this.state.paintFilterLabelMapImageData
            }
            paintFilterBackgroundImageData={
              this.state.paintFilterBackgroundImageData
            }
            viewportIndex={this.props.viewportIndex}
          />
        ) : (
          <div style={style}>
            <LoadingIndicator />
          </div>
        )}
        {childrenWithProps}
      </>
    );
  }
}

export default OHIFVTKViewport;

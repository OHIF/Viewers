import React from 'react';
import PropTypes from 'prop-types';
import cornerstone from 'cornerstone-core';
import { Icon } from '@ohif/ui';
import { viewportOptionsManager } from '../../utils';
import {
  isValidNumber,
  formatNumberPrecision,
  formatDICOMDate,
  formatDICOMTime,
  formatPN,
  getCompression,
} from './helpers';
import XNATViewportMenu from '../XNATViewportMenu/XNATViewportMenu';
import ViewportOverlayWarning from './ViewportOverlayWarning';

import './XNATViewportOverlay.css';

class XNATViewportOverlay extends React.PureComponent {
  static propTypes = {
    scale: PropTypes.number.isRequired,
    windowWidth: PropTypes.oneOfType([
      PropTypes.number.isRequired,
      PropTypes.string.isRequired,
    ]),
    windowCenter: PropTypes.oneOfType([
      PropTypes.number.isRequired,
      PropTypes.string.isRequired,
    ]),
    imageId: PropTypes.string.isRequired,
    imageIndex: PropTypes.number.isRequired,
    stackSize: PropTypes.number.isRequired,
    viewportIndex: PropTypes.number,
    getWindowing: PropTypes.func,
    setViewportActive: PropTypes.func,
    getEnabledElement: PropTypes.func,
    getViewportSpecificData: PropTypes.func,
    setViewportStackData: PropTypes.func,
  };

  static defaultProps = {};

  constructor(props) {
    super(props);

    const { viewportIndex, getEnabledElement } = props;
    const element = getEnabledElement(viewportIndex);
    const viewportOptions = viewportOptionsManager.getViewportOptions(element);

    this.state = {
      viewportOptions,
    };

    this.updateViewportOptions = this.updateViewportOptions.bind(this);
  }

  updateViewportOptions(optionsObject) {
    const { viewportOptions } = this.state;
    const { viewportIndex, getEnabledElement } = this.props;
    const element = getEnabledElement(viewportIndex);

    const updatedOptions = { ...viewportOptions, ...optionsObject };

    viewportOptionsManager.updateViewportOptions(element, updatedOptions);

    this.setState({
      viewportOptions: updatedOptions,
    });
  }

  getAuxiliaryInformation() {
    const { viewportIndex, imageIndex, getViewportSpecificData } = this.props;

    const auxiliaryInformation = {
      fusionDescription: null,
      stackDescription: null,
    };

    const viewportSpecificData = getViewportSpecificData();
    if (!viewportSpecificData) {
      return auxiliaryInformation;
    }

    // Image fusion information
    const imageFusionData = viewportSpecificData.imageFusionData;
    if (imageFusionData) {
      let fusionDescription =
        imageFusionData.fusionActive && imageFusionData.fusionDescription
          ? imageFusionData.fusionDescription
          : null;
      if (fusionDescription && imageFusionData.colormapName) {
        fusionDescription += ` [${imageFusionData.colormapName}]`;
      }
      auxiliaryInformation.fusionDescription = fusionDescription;
    }

    // Stack information
    if (viewportSpecificData.isSubStack) {
      const { stackData, getSubStackGroupData } = viewportSpecificData;
      const { stackName, refIndices } = stackData;
      const { groupLabels, dimensionValues } = getSubStackGroupData();

      const refIndex = refIndices[imageIndex - 1];
      const refValues = dimensionValues[refIndex];

      if (refValues !== undefined) {
        const stackValues = [];
        for (let i = 1; i < refValues.length; i++) {
          stackValues.push(`${groupLabels[i].groupName}: ${refValues[i]}`);
        }

        auxiliaryInformation.stackDescription = (
          <>
            <div>{`Stack: ${stackName}`}</div>
            <div>{`[${stackValues.join(', ')}]`}</div>
          </>
        );
      }
    }

    // Multiple display sets
    if (viewportSpecificData.hasMultiDisplaySets) {
      const groupData = viewportSpecificData.subDisplaySetGroupData;
      const viewportInfo = groupData.getViewportDisplaySetInfo(viewportIndex);
      if (viewportInfo) {
        const length = groupData.displaySets.length;
        auxiliaryInformation.multiDisplaySetDescription = (
          <>
            <div>
              {`Multiple Enhanced Images: ${viewportInfo.label}/${length}`}
            </div>
          </>
        );
      }
    }

    return auxiliaryInformation;
  }

  render() {
    const {
      imageId,
      scale,
      windowWidth,
      windowCenter,
      imageIndex,
      stackSize,
      viewportIndex,
      getWindowing,
      setViewportActive,
      getViewportSpecificData,
      setViewportStackData,
    } = this.props;

    const { viewportOptions } = this.state;

    if (!imageId) {
      return null;
    }

    const optionIndicatorContent = (
      <React.Fragment>
        <div>
          {viewportOptions.sync && <Icon name="xnat-sync" />}
          {viewportOptions.annotate && <Icon name="xnat-annotate" />}
          {viewportOptions.smooth && <Icon name="xnat-smooth" />}
        </div>
      </React.Fragment>
    );

    let overlayContent;

    if (!viewportOptions.overlay) {
      overlayContent = (
        <div className="top-right overlay-element">
          {optionIndicatorContent}
        </div>
      );
    } else {
      const warningList = [];
      const zoomPercentage = formatNumberPrecision(scale * 100, 0);
      const seriesMetadata =
        cornerstone.metaData.get('generalSeriesModule', imageId) || {};
      const imagePlaneModule =
        cornerstone.metaData.get('imagePlaneModule', imageId) || {};
      const {
        rows,
        columns,
        sliceThickness,
        sliceLocation,
        warnings: imagePlaneModuleWarnings,
      } = imagePlaneModule;
      if (imagePlaneModuleWarnings) {
        warningList.push(imagePlaneModuleWarnings);
      }
      const { seriesNumber, seriesDescription, modality } = seriesMetadata;

      const generalStudyModule =
        cornerstone.metaData.get('generalStudyModule', imageId) || {};
      const { studyDate, studyTime, studyDescription } = generalStudyModule;

      const patientModule =
        cornerstone.metaData.get('patientModule', imageId) || {};
      const { patientId, patientName } = patientModule;

      const generalImageModule =
        cornerstone.metaData.get('generalImageModule', imageId) || {};
      const { instanceNumber } = generalImageModule;

      const cineModule = cornerstone.metaData.get('cineModule', imageId) || {};
      let { frameTime } = cineModule;

      frameTime = frameTime === 0 ? -1 : frameTime;
      const frameRate = formatNumberPrecision(1000 / frameTime, 1);
      const compression = getCompression(imageId);
      const wwwc = `W: ${
        windowWidth.toFixed ? windowWidth.toFixed(0) : windowWidth
      } L: ${windowCenter.toFixed ? windowCenter.toFixed(0) : windowCenter}`;
      const imageDimensions = `${columns} x ${rows}`;

      const windowing = getWindowing(viewportIndex);

      const {
        fusionDescription,
        stackDescription,
        multiDisplaySetDescription,
      } = this.getAuxiliaryInformation();

      overlayContent = (
        <React.Fragment>
          <div className="top-left overlay-element">
            <div>{formatPN(patientName)}</div>
            <div>{patientId}</div>
          </div>
          <div className="top-right overlay-element">
            <div>{studyDescription}</div>
            <div>
              {formatDICOMDate(studyDate)} {formatDICOMTime(studyTime)}
            </div>
            {optionIndicatorContent}
          </div>
          <div className="bottom-right overlay-element">
            <div>Zoom: {zoomPercentage}%</div>
            <div>{wwwc}</div>
            {windowing && <div>{`Windowing: ${windowing}`}</div>}
            <div className="compressionIndicator">{compression}</div>
            <div>{fusionDescription}</div>
          </div>
          <div className="bottom-left overlay-element">
            <div>
              <ViewportOverlayWarning warningList={warningList} />
            </div>
            <div>{modality}</div>
            <div>{seriesNumber >= 0 ? `Ser: ${seriesNumber}` : ''}</div>
            <div>
              {stackSize > 1
                ? `Img: ${instanceNumber} ${imageIndex}/${stackSize}`
                : ''}
            </div>
            <div>
              {frameRate >= 0
                ? `${formatNumberPrecision(frameRate, 2)} FPS`
                : ''}
              <div>{imageDimensions}</div>
              <div>
                {isValidNumber(sliceLocation)
                  ? `Loc: ${formatNumberPrecision(sliceLocation, 2)} mm `
                  : ''}
                {sliceThickness
                  ? `Thick: ${formatNumberPrecision(sliceThickness, 2)} mm`
                  : ''}
              </div>
              <div>{seriesDescription}</div>
              <div style={{ color: 'var(--snackbar-warning)' }}>
                {multiDisplaySetDescription}
              </div>
              <div style={{ color: 'var(--snackbar-warning)' }}>
                {stackDescription}
              </div>
            </div>
          </div>
        </React.Fragment>
      );
    }

    return (
      <div className="OHIFCornerstoneViewportOverlay">
        <XNATViewportMenu
          viewportIndex={viewportIndex}
          viewportOptions={viewportOptions}
          updateViewportOptions={this.updateViewportOptions}
          setViewportActive={setViewportActive}
          getViewportSpecificData={getViewportSpecificData}
          setViewportStackData={setViewportStackData}
        />
        {overlayContent}
      </div>
    );
  }
}

export { XNATViewportOverlay };

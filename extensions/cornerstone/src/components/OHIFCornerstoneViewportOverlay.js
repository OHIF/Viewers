import { PureComponent } from 'react';
import React from 'react';
import PropTypes from 'prop-types';
import cornerstone from 'cornerstone-core';
import './OHIFCornerstoneViewportOverlay.css';
import {
  isValidNumber,
  formatNumberPrecision,
  formatDICOMDate,
  formatDICOMTime,
  formatPN,
  getCompression
} from '../utils/formatStudy';
import classNames from 'classnames';
import { Icon } from '@ohif/ui/src/elements/Icon';
import { Tooltip } from '@ohif/ui/src/components/tooltip';
import { OverlayTrigger } from '@ohif/ui/src/components/overlayTrigger';

class OHIFCornerstoneViewportOverlay extends PureComponent {
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
    inconsistencyWarnings: PropTypes.array.isRequired
  };

  render() {
    const { imageId, scale, windowWidth, windowCenter, inconsistencyWarnings } = this.props;

    if (!imageId) {
      return null;
    }

    const zoomPercentage = formatNumberPrecision(scale * 100, 0);
    const seriesMetadata =
      cornerstone.metaData.get('generalSeriesModule', imageId) || {};
    const imagePlaneModule =
      cornerstone.metaData.get('imagePlaneModule', imageId) || {};
    const { rows, columns, sliceThickness, sliceLocation } = imagePlaneModule;
    const { seriesNumber, seriesDescription } = seriesMetadata;

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
    const { frameTime } = cineModule;

    const frameRate = formatNumberPrecision(1000 / frameTime, 1);
    const compression = getCompression(imageId);
    const wwwc = `W: ${
      windowWidth.toFixed ? windowWidth.toFixed(0) : windowWidth
    } L: ${windowWidth.toFixed ? windowCenter.toFixed(0) : windowCenter}`;
    const imageDimensions = `${columns} x ${rows}`;

    const { imageIndex, stackSize } = this.props;

    const inconsistencyWarningsOn = inconsistencyWarnings && inconsistencyWarnings.length !== 0 ? true : false;
    const getWarningContent = (warningList) => {
      if (Array.isArray(warningList)) {
        const listedWarnings = warningList.map((warn, index) => {
          return <li key={index}>{warn}</li>;
        });

        return <ol>{listedWarnings}</ol>;
      } else {
        return <React.Fragment>{warningList}</React.Fragment>;
      }
    };

    const getWarningInfo = (seriesNumber, inconsistencyWarnings) => {
      return(
        <React.Fragment>
        {inconsistencyWarnings.length != 0 ? (
          <OverlayTrigger
            key={seriesNumber}
            placement="left"
            overlay={
              <Tooltip
                placement="left"
                className="in tooltip-warning"
                id="tooltip-left"
              >
                <div className="warningTitle">Series Inconsistencies</div>
                <div className="warningContent">{getWarningContent(inconsistencyWarnings)}</div>
              </Tooltip>
            }
          >
            <div className={classNames('warning')}>
              <span className="warning-icon">
                <Icon name="exclamation-triangle" />
              </span>
            </div>
          </OverlayTrigger>
        ) : (
          <React.Fragment></React.Fragment>
          )}
      </React.Fragment>
      );
    };

    const normal = (
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
        </div>
        <div className="bottom-right overlay-element">
          <div>Zoom: {zoomPercentage}%</div>
          <div>{wwwc}</div>
          <div className="compressionIndicator">{compression}</div>
        </div>
        <div className="bottom-left2 warning">
          <div>{inconsistencyWarningsOn ? getWarningInfo(seriesNumber, inconsistencyWarnings) : ''}</div>
        </div>
        <div className="bottom-left overlay-element">
          <div>{seriesNumber >= 0 ? `Ser: ${seriesNumber}` : ''}</div>
          <div>
            {stackSize > 1
              ? `Img: ${instanceNumber} ${imageIndex}/${stackSize}`
              : ''}
          </div>
          <div>
            {frameRate >= 0 ? `${formatNumberPrecision(frameRate, 2)} FPS` : ''}
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
          </div>
        </div>
      </React.Fragment>
    );

    return <div className="OHIFCornerstoneViewportOverlay">{normal}</div>;
  }
}

export default OHIFCornerstoneViewportOverlay;

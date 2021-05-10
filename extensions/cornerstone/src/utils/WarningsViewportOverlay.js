import { PureComponent } from 'react';
import React from 'react';
import PropTypes from 'prop-types';
import cornerstone from 'cornerstone-core';
import './WarningsViewportOverlay.css';
import moment from 'moment';
import classNames from 'classnames';
import { Icon } from '@ohif/ui/src/elements/Icon';
import { Tooltip } from '@ohif/ui/src/components/tooltip';
import { OverlayTrigger } from '@ohif/ui/src/components/overlayTrigger';

function isValidNumber(value) {
  return typeof value === 'number' && !isNaN(value);
}

function formatNumberPrecision(number, precision) {
  if (number !== null) {
    return parseFloat(number).toFixed(precision);
  }
}

/**
* Formats DICOM date.
*
* @param {string} date
* @param {string} strFormat
*/
function formatDICOMDate(date, strFormat = 'MMM D, YYYY') {
  return moment(date, 'YYYYMMDD').format(strFormat);
}

/**
*    DICOM Time is stored as HHmmss.SSS, where:
*      HH 24 hour time:
*        m mm        0..59   Minutes
*        s ss        0..59   Seconds
*        S SS SSS    0..999  Fractional seconds
*
*        Goal: '24:12:12'
*
* @param {*} time
* @param {string} strFormat
*/
function formatDICOMTime(time, strFormat = 'HH:mm:ss') {
  return moment(time, 'HH:mm:ss').format(strFormat);
}

/**
 * Formats a patient name for display purposes
 */
function formatPN(name) {
  if (!name) {
    return;
  }

  // Convert the first ^ to a ', '. String.replace() only affects
  // the first appearance of the character.
  const commaBetweenFirstAndLast = name.replace('^', ', ');

  // Replace any remaining '^' characters with spaces
  const cleaned = commaBetweenFirstAndLast.replace(/\^/g, ' ');

  // Trim any extraneous whitespace
  return cleaned.trim();
}

function getCompression(imageId) {
  const generalImageModule =
    cornerstone.metaData.get('generalImageModule', imageId) || {};
  const {
    lossyImageCompression,
    lossyImageCompressionRatio,
    lossyImageCompressionMethod,
  } = generalImageModule;

  if (lossyImageCompression === '01' && lossyImageCompressionRatio !== '') {
    const compressionMethod = lossyImageCompressionMethod || 'Lossy: ';
    const compressionRatio = formatNumberPrecision(
      lossyImageCompressionRatio,
      2
    );
    return compressionMethod + compressionRatio + ' : 1';
  }

  return 'Lossless / Uncompressed';
}

class WarningsViewportOverlay extends PureComponent {
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
    warningsList: PropTypes.array.isRequired
  };

  render() {
    const { imageId, scale, windowWidth, windowCenter, warningsList } = this.props;

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

    const warningListOn = warningsList && warningsList.length !== 0 ? true : false;
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

    const getWarningInfo = (seriesNumber, warningsList) => {
      return(
        <React.Fragment>
        {warningsList.length != 0 ? (
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
                <div className="warningContent">{getWarningContent(warningsList)}</div>
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
          <div>{warningListOn ? getWarningInfo(seriesNumber, warningsList) : ''}</div>
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

    return <div className="WarningsViewportOverlay">{normal}</div>;
  }
}

export default WarningsViewportOverlay;

import { Component } from 'react';
import React from 'react';
import PropTypes from 'prop-types';
import './ViewportOverlay.styl';
import { viewportOverlayUtils } from '../../../lib/viewportOverlayUtils';
import { helpers } from '../../../lib/helpers/index.js';
const { formatPN, formatDA, formatNumberPrecision, formatTM, isValidNumber} = helpers;

function getCompression(imageId) {
  const instance = cornerstone.metaData.get('instance', imageId);
  if (!instance) {
      return '';
  }

  if (instance.lossyImageCompression === '01' &&
      instance.lossyImageCompressionRatio !== '') {
      const compressionMethod = instance.lossyImageCompressionMethod || 'Lossy: ';
      const compressionRatio = formatNumberPrecision(instance.lossyImageCompressionRatio, 2);
      return compressionMethod + compressionRatio + ' : 1';
  }

  return 'Lossless / Uncompressed';
}

function getImageDimensions(imageId) {
  const instance = cornerstone.metaData.get('instance', imageId)
  if (!instance) {
      return '';
  }

  return `${instance.columns} x ${instance.rows}`;
}

class ViewportOverlay extends Component {
  render() {
    const zoom = this.props.viewport.scale * 100;
    const imageId = this.props.imageId;

    const patientMetadata = cornerstone.metaData.get('patient', imageId);
    const studyMetadata = cornerstone.metaData.get('study', imageId);
    const seriesMetadata = cornerstone.metaData.get('series', imageId);
    const instanceMetadata = cornerstone.metaData.get('instance', imageId);

    const patientName = patientMetadata.name;
    const patientId = patientMetadata.id;;
    const { studyDate, studyTime, studyDescription } = studyMetadata;
    const { seriesNumber, seriesDescription } = seriesMetadata;
    const { instanceNumber, frameTime, thickness, spacingBetweenSlices, sliceLocation } = instanceMetadata;
    const frameRate = formatNumberPrecision(1000 / frameTime, 1);
    const compression = getCompression(imageId);
    const windowWidth = this.props.viewport.voi.windowWidth || 0;
    const windowCenter = this.props.viewport.voi.windowCenter || 0;
    const wwwc = `W: ${windowWidth.toFixed(0)} L: ${windowCenter.toFixed(0)}`;
    const imageIndex = this.props.stack.imageIds.indexOf(this.props.imageId) + 1;
    const numImages = this.props.stack.imageIds.length;
    const imageDimensions = getImageDimensions(imageId);

    const normal = (<>
      <div className="top-left overlay-element">
          <div>{formatPN(patientName)}</div>
          <div>{patientId}</div>
      </div>
      <div className="top-right overlay-element">
          <div>{studyDescription}</div>
          <div>{formatDA(studyDate)} {formatTM(studyTime)}</div>
      </div>
      <div className="bottom-right overlay-element">
        <div>Zoom: {formatNumberPrecision(zoom,0)}%</div>
            <div className="compressionIndicator">{compression}</div>
            <div>{wwwc}</div>
        </div>
        <div className="bottom-left overlay-element">
            <div>{seriesNumber >= 0 ? `Ser: ${seriesNumber}` : ''}</div>
            <div>{numImages > 1 ? `Img: ${instanceNumber} ${imageIndex}/${numImages}` : ''}</div>
            <div>{frameRate >= 0 ? `${formatNumberPrecision(frameRate, 2)} FPS` : ''}
            <div>{imageDimensions}</div>
            <div>
              <span>{isValidNumber(sliceLocation) ? `Loc: ${formatNumberPrecision(sliceLocation, 2)} mm` : ''}</span>
              <span>{thickness ? `Thick: ${formatNumberPrecision(thickness, 2)} mm` : ''}</span>
              <span>{spacingBetweenSlices ? `Spacing: ${formatNumberPrecision(spacingBetweenSlices, 2)} mm` : ''}</span>
            </div>
            <div>{seriesDescription}</div>
        </div>
      </div>
    </>);

    const rightOnly = (<>
      <div className="top-right overlay-element">
        <div>{formatPN(patientName)}</div>
        <div>{patientId}</div>
        <div>{studyDescription}</div>
        <div>{formatDA(studyDate)} {formatTM(studyTime)}</div>
      </div>
      <div className="bottom-right overlay-element">
        <div>{seriesNumber >= 0 ? `Ser: ${seriesNumber}` : ''}</div>
        <div>{numImages > 1 ? `Img: ${instanceNumber} ${imageIndex}/${numImages}` : ''}</div>
        <div>{frameRate >= 0 ? `${formatNumberPrecision(frameRate, 2)} FPS` : ''}</div>
        <div>{imageDimensions}</div>
        <div>{seriesDescription}</div>
        <div>Zoom: ${formatNumberPrecision(zoom, 0)}%</div>
        <div className="compressionIndicator">{compression}</div>
        <div>{wwwc}</div>
      </div>
    </>);

    const leftOnly = (<>
      <div className="top-left overlay-element">
        <div>{formatPN(patientName)}</div>
        <div>{patientId}</div>
        <div>{studyDescription}</div>
        <div>{formatDA(studyDate)} {formatTM(studyTime)}</div>
      </div>
      <div className="bottom-left overlay-element">
        <div>{seriesNumber >= 0 ? `Ser: ${seriesNumber}` : ''}</div>
        <div>{numImages > 1 ? `Img: ${instanceNumber} ${imageIndex}/${numImages}` : ''}</div>
        <div>{frameRate >= 0 ? `${formatNumberPrecision(frameRate, 2)} FPS` : ''}</div>
        <div>{imageDimensions}</div>
        <div>{seriesDescription}</div>
        <div>Zoom: ${formatNumberPrecision(zoom, 0)}%</div>
        <div className="compressionIndicator">{compression}</div>
        <div>{wwwc}</div>
      </div>
    </>);

    return (
      <div className='ViewportOverlay'>
        {normal}
      </div>
    );
  }
}

ViewportOverlay.propTypes = {
  viewport: PropTypes.object.isRequired,
  imageId: PropTypes.string.isRequired,
  stack: PropTypes.object.isRequired
};

export default ViewportOverlay;

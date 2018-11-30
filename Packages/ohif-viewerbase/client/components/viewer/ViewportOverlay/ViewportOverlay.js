import { Component } from 'react';
import React from 'react';
import PropTypes from 'prop-types';
import './ViewportOverlay.styl';

class ViewportOverlay extends Component {
  render() {
    const scale = Math.round(this.props.viewport.scale * 100) / 100;
    const imageId = this.props.imageId;

    /*const patientId = cornerstone.metaData.get('00100020', imageId);
    const studyDate = cornerstone.metaData.get('00080020', imageId);
    const collection = cornerstone.metaData.get('00131010', imageId);
    const studyDescription = cornerstone.metaData.get('00081030', imageId);*/

    const windowWidth = Math.round(this.props.viewport.voi.windowWidth);
    const windowCenter = Math.round(this.props.viewport.voi.windowCenter);
    const imagesLeft =
      this.props.stack.imageIds.length - this.props.numImagesLoaded;

    return (
      <div className="ViewportOverlay">
        <div className="top-left overlay-element">
          <span>{this.props.patientId}</span>
          <span>{this.props.studyDate}</span>
          <span>{this.props.studyDescription}</span>
          <span>
            {imagesLeft > 0 ? `${imagesLeft} images remaining...` : ''}
          </span>
        </div>
        <div className="bottom-left overlay-element">Zoom: {scale}</div>
        <div className="bottom-right overlay-element">
          <span>
            WW/WC: {windowWidth} / {windowCenter}
          </span>
          <span>
            Image: {this.props.stack.currentImageIdIndex + 1} /{' '}
            {this.props.stack.imageIds.length}
          </span>
        </div>
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

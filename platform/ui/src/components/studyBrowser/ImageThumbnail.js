/* global cornerstone */
import './ImageThumbnail.styl';

import { utils } from '@ohif/core';
import React, { PureComponent } from 'react';

import PropTypes from 'prop-types';
import ViewportErrorIndicator from '../../viewer/ViewportErrorIndicator';
import ViewportLoadingIndicator from '../../viewer/ViewportLoadingIndicator';

// TODO: How should we have this component depend on Cornerstone?
// - Passed in as a prop?
// - Set as external dependency?
// - Pass in the entire load and render function as a prop?
//import cornerstone from 'cornerstone-core';

export default class ImageThumbnail extends PureComponent {
  static propTypes = {
    imageSrc: PropTypes.string,
    imageId: PropTypes.string,
    error: PropTypes.bool.isRequired,
    width: PropTypes.number.isRequired,
    height: PropTypes.number.isRequired,
    stackPercentComplete: PropTypes.number.isRequired,
  };

  static defaultProps = {
    error: false,
    stackPercentComplete: 0,
    width: 217,
    height: 123,
  };

  constructor(props) {
    super(props);
    this.cancelablePromises = [];
    this.canvas = React.createRef();
    this.state = {
      loading: this.shouldRenderToCanvas(),
    };
  }

  shouldRenderToCanvas() {
    return this.props.imageId && !this.props.imageSrc;
  }

  fetchImage() {
    const cancelablePromise = utils.makeCancelable(
      cornerstone.loadAndCacheImage(this.props.imageId)
    );
    this.cancelablePromises.push(cancelablePromise);
    return cancelablePromise;
  }

  componentDidMount() {
    if (this.shouldRenderToCanvas()) {
      this.fetchImage()
        .then(image => {
          cornerstone.renderToCanvas(this.canvas.current, image);
          this.setState({
            loading: false,
          });
        })
        .catch(error => {
          if (error.isCanceled) return;
          this.setState({
            loading: false,
            error: true,
          });
          throw new Error(error);
        });
    }
  }

  componentWillUnmount() {
    while (this.cancelablePromises.length > 0) {
      this.cancelablePromises.pop().cancel();
    }
  }

  render() {
    let loadingOrError;
    if (this.props.error) {
      loadingOrError = <ViewportErrorIndicator />;
    } else if (this.state.loading) {
      loadingOrError = <ViewportLoadingIndicator />;
    }

    const showStackLoadingProgressBar =
      this.props.stackPercentComplete !== undefined;

    return (
      <div className="ImageThumbnail">
        <div className="image-thumbnail-canvas">
          {this.shouldRenderToCanvas() ? (
            <canvas
              ref={this.canvas}
              width={this.props.width}
              height={this.props.height}
            />
          ) : (
            <img
              className="static-image"
              src={this.props.imageSrc}
              //width={this.props.width}
              height={this.props.height}
              alt={''}
            />
          )}
        </div>
        {loadingOrError}
        {showStackLoadingProgressBar && (
          <div className="image-thumbnail-progress-bar">
            <div
              className="image-thumbnail-progress-bar-inner"
              style={{ width: `${this.props.stackPercentComplete}%` }}
            />
          </div>
        )}
        {this.state.loading && (
          <div className="image-thumbnail-loading-indicator"></div>
        )}
      </div>
    );
  }
}

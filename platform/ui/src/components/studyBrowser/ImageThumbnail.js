import './ImageThumbnail.styl';

import React, { PureComponent } from 'react';

import PropTypes from 'prop-types';
import ViewportErrorIndicator from '../../viewer/ViewportErrorIndicator';
import ViewportLoadingIndicator from '../../viewer/ViewportLoadingIndicator';

// TODO: How should we have this component depend on Cornerstone?
// - Passed in as a prop?
// - Set as external dependency?
// - Pass in the entire load and render function as a prop?
//import cornerstone from 'cornerstone-core';

/**
 * Asynchronous wrapper around Cornerstone's renderToCanvas method.
 *
 * @param {HTMLElement} canvasElement An HTML <canvas> element
 * @param {Image} image A Cornerstone Image
 *
 * @return {Promise} A promise tracking the progress of the rendering. Resolves empty.
 */
function renderAsync(canvasElement, image) {
  return new Promise((resolve, reject) => {
    try {
      cornerstone.renderToCanvas(canvasElement, image);
      resolve();
    } catch (error) {
      reject(error);
    }
  });
}

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

    this.canvas = React.createRef();

    const renderIntoCanvas = this.props.imageId && !this.props.imageSrc;

    this.state = {
      loading: renderIntoCanvas,
    };
  }

  componentDidMount() {
    const renderIntoCanvas = this.props.imageId && !this.props.imageSrc;

    if (renderIntoCanvas) {
      const { imageId } = this.props;
      const canvas = this.canvas.current;

      cornerstone.loadAndCacheImage(imageId).then(
        image => {
          renderAsync(canvas, image).then(
            () => {
              this.setState({
                loading: false,
              });
            },
            error => {
              // TODO: Set state?
              throw new Error(error);
            }
          );
        },
        error => {
          // TODO: Set state?
          throw new Error(error);
        }
      );
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

    const renderIntoCanvas = this.props.imageId && !this.props.imageSrc;

    return (
      <div className="ImageThumbnail">
        <div className="image-thumbnail-canvas">
          {renderIntoCanvas ? (
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
      </div>
    );
  }
}

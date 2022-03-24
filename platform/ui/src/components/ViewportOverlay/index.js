import React from 'react';
import ListContent from './ListContent';
import PropTypes from 'prop-types';
import defaultViewportOverlayConfig from './viewportOverlayConfig';

/**
 * A viewport overlay UI element that takes a parameter
 * viewportOverlayConfig which specifies the contents of the overlay.
 *
 * @param {object} props
 * @param {object} props.viewportOverlayConfig
 * @param {object} viewportOverlayConfig.contents containing overlays to display
 * @returns A viewport overlay object.
 */
const ViewportOverlay = (props) => {
  const { imageId, viewportOverlayConfig = defaultViewportOverlayConfig } = props;
  const { contents } = viewportOverlayConfig;

    if (!imageId) {
      return null;
    }

    return (
      <div className="text-primary-light">
        {Object.values(contents).map((item, index) => ListContent(props, item, viewportOverlayConfig, index))}
      </div>
    );
  };

ViewportOverlay.propTypes = {
    imageId: PropTypes.string.isRequired,
  viewportOverlayConfig: PropTypes.object,
};

export default ViewportOverlay;
export { ViewportOverlay, defaultViewportOverlayConfig };

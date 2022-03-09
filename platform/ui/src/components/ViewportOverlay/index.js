import React from 'react';
import ConfigPoint from 'config-point'
import ListContent from './ListContent';
import PropTypes from 'prop-types';
import itemGenerator from './itemGenerator';

/**
 * Generates a viewport overlay given a configuration element.
 * The element typically comes from config-point, and contains
 * things like the topleft/topRight/bottomleft/bottomRight definitions.
 * @param {*} config is a configuration object that defines four lists of elements,
 * one topLeft, topRight, bottomLeft, bottomRight contents.
 * @returns React Viewport overlay function configured to use config for display
 */
const generateFromConfig = (config) => {

  const viewportOverlayComponent = (props) => {
    const { imageId } = props;
    const { contents } = config;

    if (!imageId) {
      return null;
    }

    return (
      <div className="text-primary-light">
        {Object.values(contents).map((item, index) => ListContent(props, item, config, index))}
      </div>
    );
  };

  viewportOverlayComponent.propTypes = {
    imageId: PropTypes.string.isRequired,
  };

  return viewportOverlayComponent;
};

const { ViewportOverlay } = ConfigPoint.register({
  ViewportOverlay: {
    configBase: {
      contents: {
        topLeft: {
          className: 'top-viewport left-viewport',
          dataCy: 'viewport-overlay-top-left',
          contents: [
            {
              dataCy: 'zoom',
              title: 'Zoom:',
              condition: props => props.activeTools && props.activeTools.includes("Zoom"),
              value: props => props.scale && (props.scale.toFixed(2) + "x"),
            },
            {
              dataCy: 'wwwc',
              condition: props => props.activeTools && props.activeTools.includes('Wwwc'),
              contents: props => ([
                { className: 'mr-1', value: "W:" },
                { className: 'ml-1 mr-2 font-light', value: props.windowWidth.toFixed(0) },
                { className: 'mr-1', value: "L:" },
                { className: 'ml-1 font-light', value: props.windowCenter.toFixed(0) },
              ]),
            },
          ],
        },
        topRight: {
          className: 'top-viewport right-viewport-scrollbar',
          dataCy: 'viewport-overlay-top-right',
          contents: [
            {
              dataCy: 'stackSize',
              // An example of how to run this with a dynamic, safe function
              condition: { configOperation: 'safe', value: 'stackSize > 1 && image' },
              title: "I:",
              value: props => `${props.image.InstanceNumber} (${props.imageIndex}/${props.stackSize})`,
            },
          ],
        },
        bottomLeft: {
          className: 'bottom-viewport right-viewport-scrollbar',
          dataCy: 'viewport-overlay-bottom-left',
          contents: [],
        },
        bottomRight: {
          className: 'bottom-viewport left-viewport',
          dataCy: 'viewport-overlay-bottom-right',
          contents: [],
        },
      },
      itemGenerator,
      generateFromConfig,
    },
  }
});

export default ViewportOverlay;

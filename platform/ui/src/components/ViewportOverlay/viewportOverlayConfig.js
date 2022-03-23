import ConfigPoint from 'config-point'
import itemGenerator from './itemGenerator';

/**
 * This is the default viewport overlay configuration.  It can be extended
 * with config point, see viewportOverlay.json5 for an example.  It can
 * also be replaced with another object entirely unrelated to
 * config-point configuration by defining the contents and an item generator.
 */
const { viewportOverlayConfig } = ConfigPoint.register({
  viewportOverlayConfig: {
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
    },
  }
});

export default viewportOverlayConfig;

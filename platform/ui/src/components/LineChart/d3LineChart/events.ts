import * as d3Shape from 'd3-shape';
import * as d3Zoom from 'd3-zoom';

import chart from './chart';

const d3ZoomNativeEvents = [
  'wheel.zoom',
  'mousedown.zoom',
  'dblclick.zoom',
  'touchstart.zoom',
  'touchmove.zoom',
  'touchend.zoom touchcancel.zoom',
];
/**
 * Object to override native zoom events.
 * It defines a specific callback for a event name.
 *
 * @type {Object<string, function>} zoomEvents <zoom d3 event name, callback method>
 */
const zoomEvents = {
  'dblclick.zoom': (root, zoom) => {
    _resetZoom(root, zoom);
  },
};

/**
 * It resets given root
 *
 * @param {object} root svg element to be reset
 * @param {object} zoom d3 zoom object
 *
 * @modifies {root}
 */
const _resetZoom = (root, zoom) => {
  if (root) {
    root.transition().duration(750).call(zoom.transform, d3Zoom.zoomIdentity);
  }
};

const DEFAULT_MAX_ZOOM_SCALE = 20;

const _zoom = d3Zoom.zoom().scaleExtent([1, DEFAULT_MAX_ZOOM_SCALE]);

const _bindZoom = (
  root,
  gX,
  gY,
  xAxisScale,
  yAxisScale,
  xAxisGenerator,
  yAxisGenerator,
  parseXPoint,
  parseYPoint,
  datasets
) => {
  _zoom.on('zoom', _zoomListener); // .filter(zoomEventsFilter);

  _removeListeners();
  _setListeners();

  function _removeListeners() {
    for (const eventName of d3ZoomNativeEvents) {
      root.on(eventName, null);
    }
  }

  function _setListeners() {
    const keys = Object.keys(zoomEvents);

    for (const key of keys) {
      root.call(_zoom).on(key, zoomEvents[key].bind(undefined, root, _zoom));
    }
  }

  function _zoomListener(event) {
    const transformedXAxisScale = event.transform.rescaleX(xAxisScale);
    const transformedYAxisScale = event.transform.rescaleY(yAxisScale);

    chart.axis.scaleGraphics(
      gX,
      gY,
      xAxisGenerator,
      yAxisGenerator,
      transformedXAxisScale,
      transformedYAxisScale
    );

    datasets.forEach((dataset, seriesIndex) => {
      const seriesContainer = root.select(`#series_${seriesIndex}`);
      // create line
      const line = d3Shape
        .line()
        .x(parseXPoint(transformedXAxisScale))
        .y(parseYPoint(transformedYAxisScale));

      chart.lines.updateNode(seriesContainer, dataset, line);

      chart.points.updateNode(
        seriesContainer,
        dataset,
        parseXPoint(transformedXAxisScale),
        parseYPoint(transformedYAxisScale)
      );
    });
  }

  return _zoom;
};

const bindMouseEvents = (
  root,
  gX,
  gY,
  xAxisScale,
  yAxisScale,
  xAxisGenerator,
  yAxisGenerator,
  parseXPoint,
  parseYPoint,
  datasets
) => {
  if (!root) {
    return;
  }

  _bindZoom(
    root,
    gX,
    gY,
    xAxisScale,
    yAxisScale,
    xAxisGenerator,
    yAxisGenerator,
    parseXPoint,
    parseYPoint,
    datasets
  );
};

const events = {
  bindMouseEvents,
  external: {
    resetZoom: root => {
      _resetZoom(root, _zoom);
    },
  },
};

export default events;

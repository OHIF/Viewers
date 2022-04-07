import cornerstone from 'cornerstone-core';
import cornerstoneTools from 'cornerstone-tools';

const { importInternal } = cornerstoneTools;
const draw = importInternal('drawing/draw');
const drawLine = importInternal('drawing/drawLine');
const getNewContext = importInternal('drawing/getNewContext');

export default function _drawCanvasCrosshairs(eventData, center, options) {
  const context = getNewContext(eventData.canvasContext.canvas);
  const { element } = eventData;

  const centerCanvas = cornerstone.pixelToCanvas(element, center);

  const { clientWidth: width, clientHeight: height } = element;

  const offset = 10;

  draw(context, context => {
    drawLine(
      context,
      element,
      { x: centerCanvas.x + offset, y: centerCanvas.y },
      { x: width, y: centerCanvas.y },
      options,
      'canvas'
    );

    drawLine(
      context,
      element,
      { x: centerCanvas.x - offset, y: centerCanvas.y },
      { x: 0, y: centerCanvas.y },
      options,
      'canvas'
    );

    drawLine(
      context,
      element,
      { x: centerCanvas.x, y: centerCanvas.y + offset },
      { x: centerCanvas.x, y: height },
      options,
      'canvas'
    );

    drawLine(
      context,
      element,
      { x: centerCanvas.x, y: centerCanvas.y - offset },
      { x: centerCanvas.x, y: 0 },
      options,
      'canvas'
    );
  });
}

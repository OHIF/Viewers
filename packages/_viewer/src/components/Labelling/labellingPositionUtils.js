import cornerstone from 'cornerstone-core';

const buttonSize = {
  width: 96,
  height: 28,
};

export function getAddLabelButtonStyle(measurementData, eventData) {
  const { start, end } = measurementData.handles;
  const { client } = eventData.currentPoints;
  const clientStart = cornerstone.pixelToCanvas(eventData.element, start);
  const clientEnd = cornerstone.pixelToCanvas(eventData.element, end);
  const canvasOffSetLeft = client.x - clientStart.x;
  const canvasOffSetTop = client.y - clientStart.y;
  const position = {
    left: clientEnd.x + canvasOffSetLeft,
    top: clientEnd.y + canvasOffSetTop,
  };

  if (start.y > end.y) {
    position.top -= buttonSize.height;
  }
  if (start.x > end.x) {
    position.left -= buttonSize.width;
  }

  return position;
}

export function getDialogStyle(componentStyle) {
  const style = Object.assign({}, componentStyle);
  const dialogProps = {
    width: 320,
    height: 230,
  };

  // Get max values to avoid position out of the screen
  const maxLeft = window.innerWidth - dialogProps.width;
  const maxTop = window.innerHeight - dialogProps.height;

  // Positioning the dialog with its center on the click event
  style.left -= dialogProps.width / 2;
  style.top -= dialogProps.height / 2;

  if (style.left > maxLeft) {
    style.left = maxLeft;
  }
  if (style.top > maxTop) {
    style.top = maxTop;
  }

  return style;
}

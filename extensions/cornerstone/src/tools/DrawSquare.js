import { getViewport, pixelToCanvas } from 'cornerstone-core';

import { importInternal } from 'cornerstone-tools';

const path = importInternal('drawing/path');

/**
 * Translate a point using a rotation angle.
 * @export @public @method
 * @name rotatePoint
 *
 * @param {Object} point - `{ x, y }` in either pixel or canvas coordinates.
 * @param {Object} center - `{ x, y }` in either pixel or canvas coordinates.
 * @param {Number} angle - angle in degrees
 * @returns {Object} - `{ x, y }` new point translated
 */
export function rotatePoint(point, center, angle) {
  const angleRadians = angle * (Math.PI / 180); // Convert to radians

  const rotatedX =
    Math.cos(angleRadians) * (point.x - center.x) -
    Math.sin(angleRadians) * (point.y - center.y) +
    center.x;

  const rotatedY =
    Math.sin(angleRadians) * (point.x - center.x) +
    Math.cos(angleRadians) * (point.y - center.y) +
    center.y;

  return {
    x: rotatedX,
    y: rotatedY,
  };
}

/**
 * Draw a square defined by `corner1` and `corner2`.
 * @public
 * @method drawSquare
 * @memberof Drawing
 *
 * @param {CanvasRenderingContext2D} context - Target context
 * @param {HTMLElement} element - The DOM Element to draw on
 * @param {Object} corner1 - `{ x, y }` in either pixel or canvas coordinates.
 * @param {Object} corner2 - `{ x, y }` in either pixel or canvas coordinates.
 * @param {Object} options - See {@link path}
 * @param {String} [coordSystem='pixel'] - Can be "pixel" (default) or "canvas". The coordinate
 *     system of the points passed in to the function. If "pixel" then cornerstone.pixelToCanvas
 *     is used to transform the points from pixel to canvas coordinates.
 * @param {Number} initialRotation - Square initial rotation
 * @returns {undefined}
 */
export default function(
  context,
  element,
  corner1,
  corner2,
  options,
  coordSystem = 'pixel',
  initialRotation = 0.0
) {
  if (coordSystem === 'pixel') {
    corner1 = pixelToCanvas(element, corner1);
    corner2 = pixelToCanvas(element, corner2);
  }

  const viewport = getViewport(element);

  // Calculate the center of the image
  const { clientWidth: width, clientHeight: height } = element;
  const { scale, translation } = viewport;
  const rotation = viewport.rotation - initialRotation;

  const centerPoint = {
    x: width / 2 + translation.x * scale,
    y: height / 2 + translation.y * scale,
  };

  if (Math.abs(rotation) > 0.05) {
    corner1 = rotatePoint(corner1, centerPoint, -rotation);
    corner2 = rotatePoint(corner2, centerPoint, -rotation);
  }

  const w = Math.abs(corner1.x - corner2.x);
  const h = Math.abs(corner1.y - corner2.y);
  const size = Math.min(w, h);

  corner1 = {
    x: Math.min(corner1.x, corner2.x) + (w - size) / 2,
    y: Math.min(corner1.y, corner2.y) + (h - size) / 2,
  };

  corner2 = {
    x: corner1.x + size,
    y: corner1.y + size,
  };

  let corner3 = {
    x: corner1.x + size,
    y: corner1.y,
  };

  let corner4 = {
    x: corner1.x,
    y: corner1.y + size,
  };

  if (Math.abs(rotation) > 0.05) {
    corner1 = rotatePoint(corner1, centerPoint, rotation);
    corner2 = rotatePoint(corner2, centerPoint, rotation);
    corner3 = rotatePoint(corner3, centerPoint, rotation);
    corner4 = rotatePoint(corner4, centerPoint, rotation);
  }

  path(context, options, context => {
    context.moveTo(corner1.x, corner1.y);
    context.lineTo(corner3.x, corner3.y);
    context.lineTo(corner2.x, corner2.y);
    context.lineTo(corner4.x, corner4.y);
    context.lineTo(corner1.x, corner1.y);
  });
}

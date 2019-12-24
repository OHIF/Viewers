/**
 * Get the offset for the given element
 *
 * @param {Object} element DOM element which will have the offser calculated
 * @returns {Object} Object containing the top and left offset
 */
export default function getOffset(element) {
  let top = 0;
  let left = 0;
  if (element.offsetParent) {
    do {
      left += element.offsetLeft;
      top += element.offsetTop;
    } while ((element = element.offsetParent));
  }

  return {
    left,
    top,
  };
}

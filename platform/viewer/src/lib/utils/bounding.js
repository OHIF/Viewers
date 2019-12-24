export default function bounding(elementRef, currentPosition = {}) {
  if (!elementRef.current) {
    return;
  }

  const currentElement = elementRef.current;
  const {
    offsetParent,
    offsetTop,
    offsetHeight,
    offsetLeft,
    offsetWidth,
  } = currentElement;
  let top = currentPosition.top || offsetTop;
  let left = currentPosition.left || offsetLeft;

  if (!offsetParent) {
    return;
  }

  let maxHeight = `${offsetParent.offsetHeight}px`;

  if (offsetHeight + top > offsetParent.offsetHeight) {
    top = top - (offsetHeight + top - offsetParent.offsetHeight);
    if (top < 0) {
      top = 0;
    }
  }

  if (left + offsetWidth > offsetParent.offsetWidth) {
    left = offsetParent.offsetWidth - offsetWidth;
    if (left < 0) {
      left = 0;
    }
  }

  if (maxHeight && currentElement.style.maxHeight !== maxHeight) {
    currentElement.style.maxHeight = maxHeight;
  }
  if (currentElement.style.top !== `${top}px`) {
    currentElement.style.top = `${top}px`;
  }
  if (currentElement.style.left !== `${left}px`) {
    currentElement.style.left = `${left}px`;
  }
}

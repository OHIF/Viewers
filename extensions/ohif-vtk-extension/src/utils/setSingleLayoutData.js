export default function setSingleLayoutData(
  originalArray,
  viewportIndex,
  data
) {
  const viewports = originalArray.slice();
  const layoutData = Object.assign({}, viewports[viewportIndex], data);

  viewports[viewportIndex] = layoutData;

  return viewports;
}

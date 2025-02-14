export default function getSeriesInstanceUidFromViewport(
  viewports,
  activeIndex
) {
  const activeViewport = viewports[activeIndex] || {};

  return activeViewport.SeriesInstanceUID;
}

const MIN_SR_SERIES_NUMBER = 4700;

export default function getNextSRSeriesNumber(DisplaySetService) {
  const activeDisplaySets = DisplaySetService.getActiveDisplaySets();
  const srDisplaySets = activeDisplaySets.filter(ds => ds.Modality === 'SR');
  const srSeriesNumbers = srDisplaySets.map(ds => ds.SeriesNumber);
  const maxSeriesNumber = Math.max(...srSeriesNumbers, MIN_SR_SERIES_NUMBER);

  return maxSeriesNumber + 1;
}

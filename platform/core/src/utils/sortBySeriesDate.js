/*
 * Sorting function
 * Sorts an array by seriesDate and seriesNumber if equal
 */
const sortBySeriesDate = array => array.sort((a, b) => {
  if (a.seriesNumber !== b.seriesNumber) {
    return a.seriesNumber - b.seriesNumber;
  }

  const seriesDateA = Date.parse(a.seriesDate);
  const seriesDateB = Date.parse(b.seriesDate);

  return seriesDateA - seriesDateB;
});

export default sortBySeriesDate;

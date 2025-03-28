export const getSeriesDateTime = (jsDate: Date = new Date()) => {
  const dicomDateTime = getDicomDateTime(jsDate);
  return {
    SeriesDate: dicomDateTime.date,
    SeriesTime: dicomDateTime.time,
  };
};

export const getDicomDateTime = (jsDate: Date = new Date()) => {
  const month = String(jsDate.getUTCMonth() + 1).padStart(2, '0');
  const day = String(jsDate.getUTCDate()).padStart(2, '0');
  const year = String(jsDate.getUTCFullYear()).padStart(4, '0');
  const date = `${year}${month}${day}`;
  const hours = String(jsDate.getUTCHours()).padStart(2, '0');
  const minutes = String(jsDate.getUTCMinutes()).padStart(2, '0');
  const seconds = String(jsDate.getUTCSeconds()).padStart(2, '0');
  const time = `${hours}${minutes}${seconds}`;

  return { date, time };
};

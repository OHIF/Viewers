/**
 * generateDateTimeAndLabel - Generates a time stamp and a ROICollection label.
 *
 * @param  {string} labelPrefix the prefix for the label, e.g. AIM, RTSTRUCT, etc.
 * @returns {object} An object containing the dateTime and the label.
 */
export default function generateDateTimeAndLabel(labelPrefix) {
  const d = new Date();
  const dateTime = {
    year: d.getFullYear().toString(),
    month: (d.getMonth() + 1).toString(),
    date: d.getDate().toString(),
    hours: d.getHours().toString(),
    minutes: d.getMinutes().toString(),
    seconds: d.getSeconds().toString(),
  };

  // Pad with zeros e.g. March: 3 => 03
  Object.keys(dateTime).forEach(element => {
    if (dateTime[`${element}`].length < 2) {
      dateTime[`${element}`] = '0' + dateTime[`${element}`];
    }
  });

  // Pad milliseconds with zeros
  const milliseconds = `00${d.getMilliseconds().toString()}`.slice(-3);

  const dateTimeFormated =
    dateTime.year +
    dateTime.month +
    dateTime.date +
    dateTime.hours +
    dateTime.minutes +
    dateTime.seconds;

  return {
    dateTime: dateTimeFormated,
    label: `${labelPrefix}_${dateTimeFormated.slice(
      0,
      8
    )}_${dateTimeFormated.slice(8, 14)}_${milliseconds}`,
  };
}

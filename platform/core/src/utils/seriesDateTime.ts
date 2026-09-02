/**
 * DICOM records "when an object was created" in several different attribute
 * pairs, and which of them are present depends on the modality and on whoever
 * wrote the object.  A display set, though, is shown in a single place in the
 * series list and so needs a single date/time to be ordered by.
 *
 * The pair chosen here is the latest date found in any of the allowed
 * attributes, together with the latest time found in an allowed attribute
 * carrying that exact same date.  A time is therefore never combined with a
 * date it did not come with, so the result is a date/time that really occurred
 * rather than a synthetic mix of two different timestamps.  When nothing
 * carries a time for the winning date the time is empty: ordering is then only
 * accurate to the day, which is as good as the data allows.
 *
 * Study level attributes (`StudyDate`/`StudyTime`) are deliberately not
 * included.  They are shared by every series in the study, so they cannot tell
 * one series from another, and for a report or segmentation saved days after
 * the images they are simply the wrong date.
 */
export const dateTimeAttributes: Array<[string, string]> = [
  // Instance level.  These are the only ones that change when a new instance is
  // added to an existing series - a second report saved into the same SR series
  // keeps the original SeriesDate, and only the instance date/time says that
  // the series has just been added to.
  ['InstanceCreationDate', 'InstanceCreationTime'],
  ['ContentDate', 'ContentTime'],
  ['AcquisitionDate', 'AcquisitionTime'],
  // Creation stamps written by specific derived modalities.
  ['StructureSetDate', 'StructureSetTime'],
  ['PresentationCreationDate', 'PresentationCreationTime'],
  // Series level.
  ['SeriesDate', 'SeriesTime'],
];

/**
 * Attributes holding a date and a time in one DT value (`YYYYMMDDHHMMSS...`).
 * Enhanced multi-frame objects often carry these instead of the split pair.
 */
export const dateTimeCombinedAttributes: string[] = ['AcquisitionDateTime'];

export type SeriesDateTime = {
  /** The chosen date, as found in the source, or `''`. */
  SeriesDate: string;
  /** The time belonging to that same date, as found in the source, or `''`. */
  SeriesTime: string;
};

/**
 * Reads an attribute allowing for the normalized, lower camel case spelling
 * used by series level metadata (`seriesDate` as well as `SeriesDate`).
 */
const getAttribute = (source, attribute: string) => {
  const value =
    source[attribute] ?? source[`${attribute.charAt(0).toLowerCase()}${attribute.slice(1)}`];
  return Array.isArray(value) ? value[0] : value;
};

/** A DICOM DA value as 8 comparable digits, or `''` when there is no date. */
const dateSortKey = (value): string => `${value ?? ''}`.replace(/[^0-9]/g, '').slice(0, 8);

/**
 * A DICOM TM value as a comparable fixed width string, or `''` when there is no
 * time.  Times are padded because `HHMM` and `HHMMSS` name the same instant but
 * do not compare as equal, and the fraction is separated so that a whole second
 * never compares above a fraction of the next one.
 */
const timeSortKey = (value): string => {
  const [whole = '', fraction = ''] = `${value ?? ''}`.split('.');
  const digits = whole.replace(/[^0-9]/g, '').slice(0, 6);
  if (!digits) {
    return '';
  }
  const fractionDigits = fraction.replace(/[^0-9]/g, '').slice(0, 6);
  return `${digits.padEnd(6, '0')}.${fractionDigits.padEnd(6, '0')}`;
};

/**
 * Chooses the single date/time that says when the given instance, series or
 * display set was created, from the {@link dateTimeAttributes} it carries.
 *
 * Accepts an array, in which case the latest date/time carried by any of its
 * entries is returned - the date/time of a multi instance derived series is the
 * one of its most recently created instance.
 *
 * The values are returned as found, so they are safe to store on a display set
 * and to display; use {@link getSeriesDateTimeSortKey} to compare them.
 */
export function getSeriesDateTime(source): SeriesDateTime {
  const sources = Array.isArray(source) ? source : [source];
  let SeriesDate = '';
  let SeriesTime = '';
  let dateKey = '';
  let timeKey = '';

  const consider = (dateValue, timeValue) => {
    const candidateDateKey = dateSortKey(dateValue);
    if (!candidateDateKey || candidateDateKey < dateKey) {
      return;
    }
    if (candidateDateKey > dateKey) {
      // A later date discards the time that belonged to the earlier one.
      dateKey = candidateDateKey;
      SeriesDate = `${dateValue}`;
      timeKey = '';
      SeriesTime = '';
    }
    const candidateTimeKey = timeSortKey(timeValue);
    if (candidateTimeKey > timeKey) {
      timeKey = candidateTimeKey;
      SeriesTime = `${timeValue}`;
    }
  };

  for (const item of sources) {
    if (!item) {
      continue;
    }
    for (const [dateAttribute, timeAttribute] of dateTimeAttributes) {
      consider(getAttribute(item, dateAttribute), getAttribute(item, timeAttribute));
    }
    for (const attribute of dateTimeCombinedAttributes) {
      const dateTime = `${getAttribute(item, attribute) ?? ''}`;
      if (dateTime) {
        consider(dateTime.slice(0, 8), dateTime.slice(8));
      }
    }
  }

  return { SeriesDate, SeriesTime };
}

/**
 * A date and a time as a single string that orders correctly under a natural
 * string compare, oldest first.  With no date the key is `''`, which sorts as
 * the oldest, and a date with no time sorts before every timed value of that
 * same date.
 */
export function getDateTimeSortKey(date, time): string {
  const dateKey = dateSortKey(date);
  if (!dateKey) {
    return '';
  }
  return `${dateKey} ${timeSortKey(time)}`;
}

/**
 * The {@link getSeriesDateTime} of the given instance, series or display set as
 * a {@link getDateTimeSortKey} comparable string.
 */
export function getSeriesDateTimeSortKey(source): string {
  const { SeriesDate, SeriesTime } = getSeriesDateTime(source);
  return getDateTimeSortKey(SeriesDate, SeriesTime);
}

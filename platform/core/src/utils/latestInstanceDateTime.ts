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

export type LatestInstanceDateTime = {
  /** The chosen date, as found in the source, or `''`. */
  SeriesDate: string;
  /** The time belonging to that same date, as found in the source, or `''`. */
  SeriesTime: string;
};

/**
 * `&ZZXX` - the UTC offset DICOM defines - as a number of minutes ahead of UTC,
 * or `undefined` when the value is absent or not in that format.  It is the
 * whole of `TimezoneOffsetFromUTC` (0008,0201) and the suffix a DT value may
 * end with.
 */
export function parseUTCOffset(value): number | undefined {
  const match = /^([+-])(\d{2})(\d{2})$/.exec(`${value ?? ''}`.trim());
  if (!match) {
    return undefined;
  }
  const [, sign, hours, minutes] = match;
  return (sign === '-' ? -1 : 1) * (Number(hours) * 60 + Number(minutes));
}

/**
 * A DICOM DT value: 8 digits of date, up to 6 more of time, an optional
 * fraction, and an optional `&ZZXX` offset.  A DT with fewer than 8 digits of
 * date names a year or a month rather than a day, which is not a date this can
 * order by, so it is not matched at all.
 */
const dicomDateTime = /^(\d{8})(\d{0,6})(\.\d{1,6})?([+-]\d{4})?$/;

const pad = (value: number) => `${value}`.padStart(2, '0');

/**
 * Splits a DICOM DT into a date and a time, in the timezone of the viewer.
 *
 * A DT may end with the UTC offset the rest of it is written in.  That offset
 * is not a part of the date/time, and reading it as one is how `20260819+0500`
 * becomes five in the morning and how the `05` of `202608191030-0500` becomes
 * the seconds.  It also cannot simply be dropped: the wall clock reading it
 * carries belongs to another place, so a viewer that displays it displays a
 * time that is not the time of day here, and around midnight the wrong day too.
 *
 * So a DT that declares an offset is moved to the offset of the viewer, and the
 * result is the local wall clock reading of the same instant.  A DT that
 * declares no offset is returned exactly as it was found - there is nothing to
 * say what zone it was written in, and every other attribute this module reads
 * is a bare DA or TM with the same silence.
 *
 * A DT holding a date alone names the start of that day, which is the reading
 * needed to move it, and it comes back with the time of that instant here.  It
 * gets that time even when the offset it declares is the viewer's own: two DT
 * values naming one instant have to give one answer, and returning a date alone
 * for the one that needs no move would order it before the one that does.
 *
 * @param value - the DT value
 * @param localOffsetMinutes - the offset to move the value to, in minutes ahead
 *   of UTC.  The viewer's own offset *at that instant* is used when this is not
 *   supplied, which is what keeps a summer acquisition correct when it is read
 *   in the winter.  Tests supply it to pin a result that does not depend on the
 *   zone the test runs in.
 * @returns the date and the time, or `undefined` when the value is not a DT
 *   naming a day
 */
export function expandDicomDateTime(
  value,
  localOffsetMinutes?: number
): LatestInstanceDateTime | undefined {
  const match = dicomDateTime.exec(`${value ?? ''}`.trim());
  if (!match) {
    return undefined;
  }
  const [, date, time = '', fraction = '', offset = ''] = match;

  const offsetMinutes = parseUTCOffset(offset);
  if (offsetMinutes === undefined) {
    return { SeriesDate: date, SeriesTime: `${time}${fraction}` };
  }

  // Only the hours and the minutes can move: a UTC offset is a whole number of
  // minutes, so the seconds and the fraction of the source survive untouched.
  const hours = Number(time.slice(0, 2) || 0);
  const minutes = Number(time.slice(2, 4) || 0);
  const at = new Date(0);
  at.setUTCFullYear(
    Number(date.slice(0, 4)),
    Number(date.slice(4, 6)) - 1,
    Number(date.slice(6, 8))
  );
  at.setUTCHours(hours, minutes - offsetMinutes, 0, 0);

  // Reading the instant with the local getters applies the viewer's offset at
  // that instant, daylight saving included.  A supplied offset is applied by
  // shifting the instant and reading it back in UTC instead.
  const supplied = localOffsetMinutes !== undefined;
  const local = supplied ? new Date(at.getTime() + localOffsetMinutes * 60_000) : at;
  const [year, month, day, localHours, localMinutes] = supplied
    ? [
        local.getUTCFullYear(),
        local.getUTCMonth() + 1,
        local.getUTCDate(),
        local.getUTCHours(),
        local.getUTCMinutes(),
      ]
    : [
        local.getFullYear(),
        local.getMonth() + 1,
        local.getDate(),
        local.getHours(),
        local.getMinutes(),
      ];
  // The computed reading is returned even when the offset needed no move, so
  // that two DT values naming one instant always give one answer.  The hours
  // and the minutes are always written, because a date alone cannot compare as
  // equal to the same instant written out in another offset.
  return {
    SeriesDate: `${year}${pad(month)}${pad(day)}`,
    SeriesTime: `${pad(localHours)}${pad(localMinutes)}${time.slice(4, 6)}${fraction}`,
  };
}

/**
 * Reads an attribute allowing for the normalized, lower camel case spelling
 * used by series level metadata (`seriesDate` as well as `SeriesDate`).
 */
const getAttribute = (source, attribute: string) => {
  const value =
    source[attribute] ?? source[`${attribute.charAt(0).toLowerCase()}${attribute.slice(1)}`];
  return Array.isArray(value) ? value[0] : value;
};

/**
 * A DICOM DA value as 8 comparable digits, or `''` when there is no date.
 *
 * A value that is not a DICOM DA is rejected rather than compared.  Some series
 * level metadata carries a date already formatted for display, and `19-Jan-2026`
 * would otherwise read as `192026`, which orders by day of month and makes two
 * different months compare as equal.
 */
const dateSortKey = (value): string => {
  const digits = `${value ?? ''}`.replace(/[^0-9]/g, '');
  return digits.length < 8 ? '' : digits.slice(0, 8);
};

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
 * and to display; use {@link getLatestInstanceDateTimeSortKey} to compare
 * them.  The one exception is a DT value that declares a UTC offset, which
 * {@link expandDicomDateTime} moves to the offset of the viewer first - the
 * date/time returned is then the local wall clock reading of the same instant,
 * and a valid DA and TM rather than the offset-bearing DT it came from.
 *
 * **A handler of a derived display set calls this function.  The handler of an
 * image display set must not call this function.**  A SEG, an RTSTRUCT, an SR,
 * a PMAP, a PDF, a video and a chart each need the date/time of creation of the
 * object, so a report that the user saves today into a series of last week is
 * listed as the work of today.  An image instance is different: an image
 * instance carries `AcquisitionDate` and `AcquisitionTime`, and those two
 * attributes differ between the instances of one series.  This function would
 * therefore give a different date/time to each display set of one split series.
 * The display sets of one series must tie on `dateTimeSortKey`, because only a
 * tie sends them to `compareSameSeriesDisplaySet` and to every comparison that
 * `addSameSeriesCompare` registers.  The handler of an image display set writes
 * `instance.SeriesDate` and `instance.SeriesTime` directly, and
 * `extensions/default/src/getSopClassHandlerModule.js` does exactly that.  A
 * change of that handler to this function raises no error, and puts the series
 * list in the wrong order.
 */
export function getLatestInstanceDateTime(source): LatestInstanceDateTime {
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
      const dateTime = expandDicomDateTime(getAttribute(item, attribute));
      if (dateTime) {
        consider(dateTime.SeriesDate, dateTime.SeriesTime);
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
 * The {@link getLatestInstanceDateTime} of the given instance, series or
 * display set as a {@link getDateTimeSortKey} comparable string.
 */
export function getLatestInstanceDateTimeSortKey(source): string {
  const { SeriesDate, SeriesTime } = getLatestInstanceDateTime(source);
  return getDateTimeSortKey(SeriesDate, SeriesTime);
}

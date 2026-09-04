import { DicomMetadataStore } from '../services/DicomMetadataStore/DicomMetadataStore';

/**
 * `TimezoneOffsetFromUTC` (0008,0201) as a number of minutes ahead of UTC, or
 * `undefined` when the value is absent or not the `&ZZXX` format DICOM defines.
 */
function parseTimezoneOffsetFromUTC(value): number | undefined {
  const match = /^([+-])(\d{2})(\d{2})$/.exec(`${value ?? ''}`.trim());
  if (!match) {
    return undefined;
  }
  const [, sign, hours, minutes] = match;
  return (sign === '-' ? -1 : 1) * (Number(hours) * 60 + Number(minutes));
}

/**
 * The current date and time as DICOM DA and TM values.
 *
 * DICOM DA and TM are wall clock values, read in the timezone the object
 * declares in `TimezoneOffsetFromUTC` and otherwise in the local one.  They are
 * displayed as they are stored, so a value in any other zone is simply the
 * wrong date/time to show - and around midnight the wrong day as well.
 *
 * @param now - the instant to express, defaulting to the current one
 * @param timezoneOffsetFromUTC - the object's `TimezoneOffsetFromUTC`, if it
 *   has one; local time is used when it does not
 */
export function getCurrentDicomDateTime(
  now: Date = new Date(),
  timezoneOffsetFromUTC?: string
): { date: string; time: string } {
  // The wall clock reading is the instant shifted by the zone's offset and then
  // read in UTC, which for the local zone is what the local getters return.
  const offsetMinutes =
    parseTimezoneOffsetFromUTC(timezoneOffsetFromUTC) ?? -now.getTimezoneOffset();
  const at = new Date(now.getTime() + offsetMinutes * 60_000);

  const pad = (value: number, length = 2) => `${value}`.padStart(length, '0');
  const date = `${at.getUTCFullYear()}${pad(at.getUTCMonth() + 1)}${pad(at.getUTCDate())}`;
  const time =
    `${pad(at.getUTCHours())}${pad(at.getUTCMinutes())}${pad(at.getUTCSeconds())}` +
    `.${pad(at.getUTCMilliseconds(), 3)}000`;

  return { date, time };
}

/**
 * Stamps a newly created instance - a report, segmentation or structure set
 * about to be stored - as the most recent instance of its series.
 *
 * Two things are needed for that, and neither can be left to the object
 * generation:
 *
 * When the instance is added to an existing series, the series level
 * `SeriesDate`/`SeriesTime` belong to the original series and must stay as they
 * are, so only the instance level creation date/time say that the series has
 * just been added to.  Those are what the display set date/time is chosen from
 * (see `getSeriesDateTime`), so they have to be set on every save.  They are
 * stamped in the dataset's own timezone - `TimezoneOffsetFromUTC` when it has
 * one, the local zone otherwise - because that is the wall clock reading a
 * viewer displays them as.
 *
 * The series level date/time of a series being *created* cannot be stamped here
 * for the same reason - this function cannot tell the two cases apart - so the
 * store commands pass it to the object generation instead, from
 * {@link getCurrentDicomDateTime} and in the same zone.  Without that the
 * generated `SeriesDate`/`SeriesTime` are dcmjs's UTC ones, which around
 * midnight name the wrong day and then win the latest date this reads.
 *
 * The instance number has to be higher than every instance already in the
 * series.  Deriving it from a single predecessor instance is not enough: the
 * most recently created instance of a series is not necessarily the one with
 * the highest instance number, and then `1 +` its number collides with an
 * instance that already exists.
 *
 * @param dataset - naturalized dataset, modified in place
 * @param priorInstances - the instances already in the series; read from the
 *   metadata store for the dataset's series when not supplied
 * @returns the same dataset
 */
export function updateNewInstanceMetadata(dataset, priorInstances?: Array<{ InstanceNumber }>) {
  const instances =
    priorInstances ??
    DicomMetadataStore.getSeries(dataset.StudyInstanceUID, dataset.SeriesInstanceUID)?.instances ??
    [];

  const priorInstanceNumber = instances.reduce(
    (highest, instance) => Math.max(highest, Number(instance?.InstanceNumber) || 0),
    0
  );
  dataset.InstanceNumber = priorInstanceNumber + 1;

  const { date, time } = getCurrentDicomDateTime(new Date(), dataset.TimezoneOffsetFromUTC);
  dataset.InstanceCreationDate = date;
  dataset.InstanceCreationTime = time;
  dataset.ContentDate = date;
  dataset.ContentTime = time;

  return dataset;
}

export default updateNewInstanceMetadata;

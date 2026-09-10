import { DicomMetadataStore } from '../services/DicomMetadataStore/DicomMetadataStore';
import { parseUTCOffset } from './seriesDateTime';

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
  const offsetMinutes = parseUTCOffset(timezoneOffsetFromUTC) ?? -now.getTimezoneOffset();
  const at = new Date(now.getTime() + offsetMinutes * 60_000);

  const pad = (value: number, length = 2) => `${value}`.padStart(length, '0');
  const date = `${at.getUTCFullYear()}${pad(at.getUTCMonth() + 1)}${pad(at.getUTCDate())}`;
  const time =
    `${pad(at.getUTCHours())}${pad(at.getUTCMinutes())}${pad(at.getUTCSeconds())}` +
    `.${pad(at.getUTCMilliseconds(), 3)}000`;

  return { date, time };
}

/**
 * The date/time pair an IOD defines for "when this object was created", for the
 * modalities whose IOD does not define `ContentDate`/`ContentTime`.
 *
 * An RT Structure Set is built from the Structure Set module, which carries
 * `StructureSetDate`/`StructureSetTime` (both type 2) and no content date/time
 * at all - the RTSTRUCT IOD has no General Image module and no Multi-frame
 * Functional Groups module to bring one in.  A softcopy presentation state is
 * the same story with the Presentation State Identification module, whose
 * `PresentationCreationDate`/`PresentationCreationTime` are type 1.
 *
 * Both pairs are read back by `getSeriesDateTime`, so an instance stamped
 * through this map orders exactly as one stamped with a content date/time.
 */
const modalityDateTimeAttributes: Record<string, [string, string]> = {
  RTSTRUCT: ['StructureSetDate', 'StructureSetTime'],
  PR: ['PresentationCreationDate', 'PresentationCreationTime'],
};

/**
 * The pair used by every other modality.  A segmentation gets it from the
 * Multi-frame Functional Groups module and a report from the SR Document
 * General module, both as type 1, and an ordinary image series gets it from the
 * General Image module as type 2C.
 */
const defaultDateTimeAttributes: [string, string] = ['ContentDate', 'ContentTime'];

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
 * `InstanceCreationDate`/`InstanceCreationTime` are in the SOP Common module,
 * so every IOD has them.  The creation date/time of the object itself is not
 * shared in that way: the attributes that hold it depend on the modality, and
 * writing an attribute the IOD does not define is what a strict validator or
 * archive rejects the instance for.  See {@link modalityDateTimeAttributes}.
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

  const [dateAttribute, timeAttribute] =
    modalityDateTimeAttributes[dataset.Modality] ?? defaultDateTimeAttributes;
  dataset[dateAttribute] = date;
  dataset[timeAttribute] = time;

  return dataset;
}

export default updateNewInstanceMetadata;

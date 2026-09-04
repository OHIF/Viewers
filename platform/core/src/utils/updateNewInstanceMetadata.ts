import { DicomMetadataStore } from '../services/DicomMetadataStore/DicomMetadataStore';

/**
 * The current date and time as DICOM DA and TM values, in UTC.
 *
 * UTC rather than local time because the object generation these stamps are
 * written over - dcmjs `DerivedDataset` - writes its `SeriesDate`/`SeriesTime`
 * in UTC.  Mixing the two clocks on one object would let the series and
 * instance level attributes disagree by the UTC offset, and since the display
 * set date/time is the latest date any attribute carries (see
 * `getSeriesDateTime`), a local stamp west of UTC could be passed over in
 * favour of the UTC series date it was meant to supersede.
 */
export function getCurrentDicomDateTime(now: Date = new Date()): { date: string; time: string } {
  const pad = (value: number, length = 2) => `${value}`.padStart(length, '0');
  const date = `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}`;
  const time =
    `${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}${pad(now.getUTCSeconds())}` +
    `.${pad(now.getUTCMilliseconds(), 3)}000`;

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
 * (see `getSeriesDateTime`), so they have to be set on every save.
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

  const { date, time } = getCurrentDicomDateTime();
  dataset.InstanceCreationDate = date;
  dataset.InstanceCreationTime = time;
  dataset.ContentDate = date;
  dataset.ContentTime = time;

  return dataset;
}

export default updateNewInstanceMetadata;

import { DisplaySetService, Types } from '@ohif/core';

import getNextSRSeriesNumber from './getNextSRSeriesNumber';

/**
 * Find an SR having the same series description.
 *
 * @param description - is the description to look for
 * @param displaySetService - the display sets to search for DICOM SR in
 * @returns SeriesMetadata from a DICOM SR having the same series description
 */
export default function findSRWithSameSeriesDescription(
  studyUid: string,
  seriesUid: string,
  description: string,
  displaySetService: DisplaySetService
): Types.SeriesMetadata {
  const activeDisplaySets = displaySetService.getActiveDisplaySets();
  const srDisplaySets = activeDisplaySets.filter(
    ds => ds.StudyInstanceUID === studyUid && ds.Modality === 'SR'
  );
  const sameSeries =
    srDisplaySets.find(
      ds =>
        ds.SeriesInstanceUID === seriesUid &&
        description === ds.SeriesDescription
    ) || srDisplaySets.find(ds => ds.SeriesDescription === description);
  if (sameSeries) {
    const { instances, instance } = sameSeries;
    const maxInstance = Math.max(
      instances.length,
      ...sameSeries.instances.map(it => it.InstanceNumber)
    );
    const { SeriesInstanceUID, SeriesDescription, SeriesDate, SeriesTime, SeriesNumber, Modality } =
      instance;
    return {
      SeriesInstanceUID,
      SeriesDescription,
      SeriesDate,
      SeriesTime,
      SeriesNumber,
      Modality,
      InstanceNumber: sameSeries.instances.length + 1,
    };
  }

  const SeriesNumber = getNextSRSeriesNumber(displaySetService);
  return { SeriesDescription: description, SeriesNumber };
}

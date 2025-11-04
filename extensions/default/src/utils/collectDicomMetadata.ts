import { metaData } from '@cornerstonejs/core';

type InstanceMeta = {
  SOPInstanceUID?: string;
  ImagePositionPatient?: number[];
  ImageOrientationPatient?: number[];
  Rows?: number;
  Columns?: number;
  PixelSpacing?: number[] | string;
  SliceThickness?: number | string;
};

type SeriesEntry = {
  SeriesInstanceUID?: string;
  Modality?: string;
  SeriesNumber?: number | string;
  SeriesDescription?: string;
  Instances: InstanceMeta[];
};

type StudyEntry = {
  StudyInstanceUID?: string;
  PatientID?: string;
  PatientName?: string;
  StudyDate?: string;
  StudyTime?: string;
  Series: SeriesEntry[];
};

export async function collectActiveStudyMetadata(servicesManager: AppTypes.ServicesManager) {
  const { displaySetService } = servicesManager.services as AppTypes.Services;
  const activeDisplaySets = displaySetService.getActiveDisplaySets() as any[];

  const studies = new Map<string, StudyEntry>();

  for (const ds of activeDisplaySets) {
    const studyUID = ds.StudyInstanceUID;
    const seriesUID = ds.SeriesInstanceUID;

    const study = studies.get(studyUID) ?? {
      StudyInstanceUID: studyUID,
      PatientID: ds.PatientID,
      PatientName: ds.PatientName,
      StudyDate: ds.StudyDate,
      StudyTime: ds.StudyTime,
      Series: [],
    };

    let series = study.Series.find(s => s.SeriesInstanceUID === seriesUID);
    if (!series) {
      series = {
        SeriesInstanceUID: seriesUID,
        Modality: ds.Modality,
        SeriesNumber: ds.SeriesNumber,
        SeriesDescription: ds.SeriesDescription,
        Instances: [],
      };
      study.Series.push(series);
    }

    const imageIds: string[] =
      ds.imageIds ?? (ds.images ? ds.images.map((i: any) => i.imageId) : []) ?? [];

    for (const imageId of imageIds) {
      const inst = (metaData.get('instance', imageId) as any) ?? {};
      const entry: InstanceMeta = {
        SOPInstanceUID: inst.SOPInstanceUID || inst.SopInstanceUID,
        ImagePositionPatient: inst.ImagePositionPatient,
        ImageOrientationPatient: inst.ImageOrientationPatient,
        Rows: inst.Rows,
        Columns: inst.Columns,
        PixelSpacing: inst.PixelSpacing,
        SliceThickness: inst.SliceThickness,
      };
      series.Instances.push(entry);
    }

    studies.set(studyUID, study);
  }

  return {
    studies: Array.from(studies.values()),
  };
}

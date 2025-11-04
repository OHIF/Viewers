import { metaData } from '@cornerstonejs/core';

type InstanceMeta = {
  SOPInstanceUID?: string;
  ImagePositionPatient?: number[];
  ImageOrientationPatient?: number[];
  Rows?: number;
  Columns?: number;
  PixelSpacing?: number[] | string;
  SliceThickness?: number | string;
  SOPClassUID?: string;
  ImageType?: string[];
  StudyDate?: string;
  SeriesDate?: string;
  AcquisitionDate?: string;
  ContentDate?: string;
  StudyTime?: string;
  SeriesTime?: string;
  AcquisitionTime?: string;
  ContentTime?: string;
  Raw?: Record<string, unknown>;
};

type SeriesEntry = {
  SeriesInstanceUID?: string;
  Modality?: string;
  SeriesNumber?: number | string;
  SeriesDescription?: string;
  SeriesDate?: string;
  SeriesTime?: string;
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
  type DisplaySetLike = {
    StudyInstanceUID: string;
    SeriesInstanceUID: string;
    Modality?: string;
    SeriesNumber?: number | string;
    SeriesDescription?: string;
    SeriesDate?: string;
    SeriesTime?: string;
    imageIds?: string[];
    images?: Array<{ imageId: string }>;
    PatientID?: string;
    PatientName?: string;
    StudyDate?: string;
    StudyTime?: string;
  };
  const activeDisplaySets = displaySetService.getActiveDisplaySets() as DisplaySetLike[];

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
        SeriesDate: ds.SeriesDate,
        SeriesTime: ds.SeriesTime,
        Instances: [],
      };
      study.Series.push(series);
    }

    const imageIds: string[] =
      ds.imageIds ?? (ds.images ? ds.images.map(i => i.imageId) : []) ?? [];

    for (const imageId of imageIds) {
      type DicomInstanceLike = {
        SOPInstanceUID?: string;
        SopInstanceUID?: string;
        ImagePositionPatient?: number[];
        ImageOrientationPatient?: number[];
        Rows?: number;
        Columns?: number;
        PixelSpacing?: number[] | string;
        SliceThickness?: number | string;
        SOPClassUID?: string;
        ImageType?: string[];
        StudyDate?: string;
        SeriesDate?: string;
        AcquisitionDate?: string;
        ContentDate?: string;
        StudyTime?: string;
        SeriesTime?: string;
        AcquisitionTime?: string;
        ContentTime?: string;
        PatientID?: string;
        PatientName?: string;
        [key: string]: unknown;
      };
      const inst = (metaData.get('instance', imageId) as DicomInstanceLike) ?? {};
      const entry: InstanceMeta = {
        SOPInstanceUID: inst.SOPInstanceUID || inst.SopInstanceUID,
        ImagePositionPatient: inst.ImagePositionPatient,
        ImageOrientationPatient: inst.ImageOrientationPatient,
        Rows: inst.Rows,
        Columns: inst.Columns,
        PixelSpacing: inst.PixelSpacing,
        SliceThickness: inst.SliceThickness,
        SOPClassUID: inst.SOPClassUID,
        ImageType: inst.ImageType,
        StudyDate: inst.StudyDate,
        SeriesDate: inst.SeriesDate,
        AcquisitionDate: inst.AcquisitionDate,
        ContentDate: inst.ContentDate,
        StudyTime: inst.StudyTime,
        SeriesTime: inst.SeriesTime,
        AcquisitionTime: inst.AcquisitionTime,
        ContentTime: inst.ContentTime,
        Raw: inst,
      };
      series.Instances.push(entry);

      if (!study.PatientID && inst.PatientID) {
        study.PatientID = inst.PatientID;
      }
      if (!study.PatientName && inst.PatientName) {
        study.PatientName = inst.PatientName;
      }
      if (!study.StudyDate && inst.StudyDate) {
        study.StudyDate = inst.StudyDate;
      }
      if (!study.StudyTime && inst.StudyTime) {
        study.StudyTime = inst.StudyTime;
      }
    }

    studies.set(studyUID, study);
  }

  return {
    studies: Array.from(studies.values()),
  };
}

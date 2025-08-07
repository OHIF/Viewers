import dcmjs from 'dcmjs';
import getImageIdsForInstance from './utils/getImageId';

const { DicomMetaDictionary } = dcmjs.data;
const { naturalizeDataset } = DicomMetaDictionary;


export type RawDicomInstance = PromiseFulfilledResult<any>;
export type RawDicomInstances = RawDicomInstance[];
export type SettledRawDicomInstances = RawDicomInstances[];
export type DicomSeriesHeaderMetaData = {
  StudyInstanceUID: string,
  StudyDescription: string,
  SeriesInstanceUID: string,
  SeriesDescription: string,
  SeriesNumber: number,
  SeriesTime: string,
  SOPClassUID: string,
  ProtocolName: string,
  Modality: string,
}

export interface DicomReferenceMetadata extends DicomSeriesHeaderMetaData {
  SOPInstanceUID: string,
  ImagePositionPatient?: number[],
  BitsAllocated: number,
  Rows: number,
  Columns: number,
  InstanceNumber: number,
  imageId?: string,
  wadoRoot?: string,
  wadoUri?: string,
}
export type DicomStructure = DicomReferenceMetadata;
export type DicomStructureData = DicomStructure[];

export type DicomSeriesMetaData = Map<string, DicomSeriesHeaderMetaData>;
export type DicomInstancesMetaData = Map<string, DicomStructureData>;

export type DicomStudyMetaData = {
  seriesSummaryMetadata: DicomSeriesMetaData,
  instancesPerSeries: DicomInstancesMetaData
}
export type DicomSeriesStructureData = DicomStructureData[];

export function dicomWebToSettledRawDicomInstances(instances: any[]): SettledRawDicomInstances {
  return instances.map((promise) => promise.value)
}

export function dicomWebToDicomStructure(data: RawDicomInstances): DicomStructureData {
  let naturalizedInstancesMetadata: DicomStructureData = [];
  data.forEach((seriesInstances) => {
    // This should be a single layer of promise => { status: "fulfilled", value: [{tags...}] }
    return seriesInstances.value.map((instance) => {
      naturalizedInstancesMetadata.push(naturalizeDataset(instance));
    });
  });

  return naturalizedInstancesMetadata;
}

export function generateStudyMetaData(data: DicomSeriesStructureData, dicomWebConfig): DicomStudyMetaData {
  const seriesSummaryMetadata = new Map<string, DicomSeriesHeaderMetaData>();
  const instancesPerSeries = new Map<string, DicomStructureData>();

  data.forEach((series: DicomStructureData) => {
    series.forEach((instance) => {
      const seriesInstanceUID = instance.SeriesInstanceUID;
      if (!seriesSummaryMetadata[seriesInstanceUID]) {
        seriesSummaryMetadata[seriesInstanceUID] = {
          StudyInstanceUID: instance.StudyInstanceUID,
          StudyDescription: instance.StudyDescription,
          SeriesInstanceUID: seriesInstanceUID,
          SeriesDescription: instance.SeriesDescription,
          SeriesNumber: instance.SeriesNumber,
          SeriesTime: instance.SeriesTime,
          SOPClassUID: instance.SOPClassUID,
          ProtocolName: instance.ProtocolName,
          Modality: instance.Modality,
        };
      }

      if (!instancesPerSeries[seriesInstanceUID]) {
        instancesPerSeries[seriesInstanceUID] = [];
      }

      instance.imageId = getImageIdsForInstance({
        instance,
        frame: undefined,
        config: dicomWebConfig,
      });
      instance.wadoRoot = dicomWebConfig.wadoRoot;
      instance.wadoUri = dicomWebConfig.wadoUri;

      instancesPerSeries[instance.SeriesInstanceUID].push(instance);
    });

  });

  return {seriesSummaryMetadata, instancesPerSeries}
}


export function generateInstanceReferenceMetadata(
  firstSlice: DicomReferenceMetadata,
  lastSlice: DicomReferenceMetadata,
  indx: number,
  totalSliceCount: number,
): DicomReferenceMetadata
{
  let reference: DicomReferenceMetadata = JSON.parse(JSON.stringify(firstSlice));

  // Compute slice IPP. Necessary for 3D reconstruction. We might need to account for gantry tilt
  // Someone feel free to add corrections as needed
  const firstIPP = firstSlice.ImagePositionPatient;
  const lastIPP = lastSlice.ImagePositionPatient;
  if (lastIPP) {
    const deltaIPP = (lastIPP[2] - firstIPP[2]) / totalSliceCount;
    const newIPPz = firstIPP[2] + indx * deltaIPP;
    reference.ImagePositionPatient[2] = newIPPz;
  }

  return reference;
}

export function generateInstanceMetaData (
  instanceQIDOMeta: any[],
  instanceWADOMeta: SettledRawDicomInstances
): DicomSeriesStructureData
{
  const naturalizedQIDOMetadata= instanceQIDOMeta;
  const naturalizedInstancesMetadata= [];
  const newNaturalizedInstancesMetadata: DicomSeriesStructureData = [];

  instanceWADOMeta.forEach(
    instances => naturalizedInstancesMetadata.push(dicomWebToDicomStructure(instances))
  );
  console.log(naturalizedInstancesMetadata);

  for(let i = 0; i < naturalizedQIDOMetadata.length; i++) {
    const referenceMetaData = naturalizedInstancesMetadata[i];
    const [firstSlice, lastSlice] = referenceMetaData;
    const seriesInstances = naturalizedQIDOMetadata[i];
    const newInstances: DicomStructureData = [];
    const instances = seriesInstances.value;
    const totalSliceCount = instances.length;

    for (let i = 0; i < totalSliceCount; i++) {
      const instance = instances[i];
      let newInstance = generateInstanceReferenceMetadata(
        firstSlice,
        lastSlice,
        i,
        totalSliceCount
      );

      newInstance.BitsAllocated = instance.bitsAllocated;
      newInstance.Columns = instance.columns;
      newInstance.Rows = instance.rows;
      newInstance.InstanceNumber = instance.instanceNumber;
      newInstance.SeriesInstanceUID = instance.seriesInstanceUID;
      newInstance.SOPClassUID = instance.sopClassUID;
      newInstance.SOPInstanceUID = instance.sopInstanceUID;
      newInstance.StudyInstanceUID = instance.studyInstanceUID;

      newInstances.push(newInstance);
    }
    newNaturalizedInstancesMetadata.push(newInstances);
  }

  return newNaturalizedInstancesMetadata;
}
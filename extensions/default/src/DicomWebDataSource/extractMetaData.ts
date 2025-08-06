import dcmjs from 'dcmjs';
import getImageIdsForInstance from './utils/getImageId';

const { DicomMetaDictionary } = dcmjs.data;
const { naturalizeDataset } = DicomMetaDictionary;


export type DicomStructure = any;
export type DicomStructureData = DicomStructure[];
export type SeriesDicomStructureData = DicomStructureData[];
export type RawDicomInstances = PromiseFulfilledResult<any[]>;
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

export type DicomSeriesMetaData = Map<string, DicomSeriesHeaderMetaData>;
export type DicomInstancesMetaData = Map<string, DicomStructureData>;

export type DicomStudyMetaData = {
  seriesSummaryMetadata: DicomSeriesMetaData,
  instancesPerSeries: DicomInstancesMetaData
}

export function dicomWebToDicomStructure(data: SettledRawDicomInstances): DicomStructureData {
  let naturalizedInstancesMetadata: DicomStructureData = [];
  data.forEach((seriesInstances: RawDicomInstances) => {
    return seriesInstances.value.map((instance) => {
      naturalizedInstancesMetadata.push(naturalizeDataset(instance));
    });
  });

  return naturalizedInstancesMetadata;
}

export function generateStudyMetaData(data: DicomStructure[], dicomWebConfig): DicomStudyMetaData {
  const seriesSummaryMetadata = new Map<string, DicomSeriesHeaderMetaData>();
  const instancesPerSeries = new Map<string, DicomStructureData>();

  data.forEach((series: DicomStructureData) => {
    series.forEach((instance) => {
      const seriesInstanceUID = instance.SeriesInstanceUID;
      console.log(seriesInstanceUID);
      console.log(instance);
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

      const imageId = getImageIdsForInstance({
        instance,
        frame: undefined,
        config: dicomWebConfig
      });

      instance.imageId = imageId;
      instance.wadoRoot = dicomWebConfig.wadoRoot;
      instance.wadoUri = dicomWebConfig.wadoUri;

      instancesPerSeries[instance.SeriesInstanceUID].push(instance)
    });

  });

  return {seriesSummaryMetadata, instancesPerSeries}
}

export function generateInstanceMetaData (
  instanceQIDOMeta: SettledRawDicomInstances,
  instanceWADOMeta: SettledRawDicomInstances
): DicomStructureData
{
  const naturalizedQIDOMetadata= instanceQIDOMeta;
  const naturalizedInstancesMetadata= dicomWebToDicomStructure(instanceWADOMeta);
  const newNaturalizedInstancesMetadata: DicomStructureData = [];

  for(let i = 0; i < naturalizedQIDOMetadata.length; i++) {
    const referenceMeta = naturalizedInstancesMetadata[i];
    const seriesInstances = naturalizedQIDOMetadata[i];
    const newInstances: DicomStructureData = [];

    seriesInstances.value.forEach((instance) => {
      let newInstance = JSON.parse(JSON.stringify(referenceMeta));

      newInstance.BitsAllocated = instance.bitsAllocated;
      newInstance.Columns = instance.columns;
      newInstance.Rows = instance.rows;
      newInstance.InstanceNumber = instance.instanceNumber;
      newInstance.SeriesInstanceUID = instance.seriesInstanceUID;
      newInstance.SOPClassUID = instance.sopClassUID;
      newInstance.SOPInstanceUID = instance.sopInstanceUID;
      newInstance.StudyInstanceUID = instance.studyInstanceUID;

      newInstances.push(newInstance);
    })
    newNaturalizedInstancesMetadata.push(newInstances)
  }

  return newNaturalizedInstancesMetadata;
}
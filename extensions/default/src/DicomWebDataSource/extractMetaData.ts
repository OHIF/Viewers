
import dcmjs from 'dcmjs';
import getImageIdsForInstance from './utils/getImageId';
const { DicomMetaDictionary } = dcmjs.data;
const { naturalizeDataset } = DicomMetaDictionary;


export type DicomStructure = any;
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
export type DicomInstancesMetaData = Map<string, DicomStructure[]>;

export type DicomStudyMetaData = {
  seriesSummaryMetadata: DicomSeriesMetaData,
  instancesPerSeries: DicomInstancesMetaData
}

export function dicomWebToDicomStructure(data: PromiseSettledResult<any>[]): DicomStructure[] {
  let naturalizedInstancesMetadata: DicomStructure[] = [];
  data.forEach((seriesInstances: PromiseFulfilledResult<any[]>) => {
    return seriesInstances.value.map((instance) => {
      naturalizedInstancesMetadata.push(naturalizeDataset(instance));
    });
  });

  return naturalizedInstancesMetadata;
}

export function reconstructStudyMetaData(data: DicomStructure[], dicomWebConfig): DicomStudyMetaData {
  const seriesSummaryMetadata = new Map<string, DicomSeriesHeaderMetaData>();
  const instancesPerSeries = new Map<string, DicomStructure[]>();

  data.forEach(instance => {
    if (!seriesSummaryMetadata[instance.SeriesInstanceUID]) {
      seriesSummaryMetadata[instance.SeriesInstanceUID] = {
        StudyInstanceUID: instance.StudyInstanceUID,
        StudyDescription: instance.StudyDescription,
        SeriesInstanceUID: instance.SeriesInstanceUID,
        SeriesDescription: instance.SeriesDescription,
        SeriesNumber: instance.SeriesNumber,
        SeriesTime: instance.SeriesTime,
        SOPClassUID: instance.SOPClassUID,
        ProtocolName: instance.ProtocolName,
        Modality: instance.Modality,
      };
    }

    if (!instancesPerSeries[instance.SeriesInstanceUID]) {
      instancesPerSeries[instance.SeriesInstanceUID] = [];
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

  return {seriesSummaryMetadata, instancesPerSeries}
}
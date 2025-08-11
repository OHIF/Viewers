/**
 * Tools for extracting key metadata items from QIDO and WADO queries such that it is digestible
 * by the viewer.
 */
import dcmjs from 'dcmjs';
import getImageIdsForInstance from './utils/getImageId';
import {DicomWebConfig} from './dicomWebConfig';

const { DicomMetaDictionary } = dcmjs.data;
const { naturalizeDataset } = DicomMetaDictionary;

export type RawDicomInstance = PromiseFulfilledResult<any>;
export type RawDicomInstances = RawDicomInstance[];
export type SettledRawDicomInstances = RawDicomInstances[];

/**
 * Series level metadata header type. Here, we collect all of the metadata necessary for describing
 * an input study
 */
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

/**
 * This type adds the fields we need to track an instance. Some of the data can be obtained from
 * QIDO responses and other data such as ImagePositionPatient (IPP) comes from WADO responses.
 */
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

/**
 * This type puts together all of the instance metadata and series metadata in one structure that
 * mirrors the data structure expected by the Viewer.
 */
export type DicomStudyMetaData = {
  seriesSummaryMetadata: DicomSeriesMetaData,
  instancesPerSeries: DicomInstancesMetaData
}
export type DicomSeriesStructureData = DicomStructureData[];

/**
 * Takes a list of settled promises containing fulfilled promises and returns a list of lists of
 * fulfilled promises.
 *
 * The goal here is to take the data returned by `dicomweb-client`, which lacks type information and
 * begin adding type annotations.
 *
 * @param instances list of settled promises containing fulfilled promises
 */
export function dicomWebToSettledRawDicomInstances(instances: any[]): SettledRawDicomInstances {
  return instances.map((promise) => promise.value)
}


/**
 * Converts a list of a list of fulfilled promises into a list of `DicomStructure`.
 * This function calls the `dcmjs` `naturalizeDataset` function to cast the input into a DICOM
 * structure. I then take this structure and push it into a list that assumes the input is a
 * `DicomStructure`. From this point on, the metadata of interest is annotated for linter checks.
 *
 * @param data list of a list of fulfilled promises
 */
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

/**
 * Goes through each input instances and generates a series summary header and sorts the instances.
 * The idea is to organize the data into two lists. One list for the series metadata header and
 * one list for the instances in `DicomStructure` layout.
 *
 * Something else we do is generate an image ID to be associated with the input the instance.
 * We need the system configuration for this process.
 * We also use the configuration to associate the WADO root and uri urls to the instances for later
 * instance retrieval.
 *
 * @param data list of list of `DicomStructure` instances
 * @param dicomWebConfig reference to system configuration to adjust the instance metadata.
 */
export function generateStudyMetaData(data: DicomSeriesStructureData, dicomWebConfig: DicomWebConfig): DicomStudyMetaData {
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

/**
 * Patch the instance IPP assuming a uniform change between slices such that they are in roughly
 * the correct location in space for 3D reconstruction.
 *
 * The IPP delta between slices in a series is typically in the z direction and uniform.
 * To generate the new slice IPP, I use the first and last slices as guides to obtain the
 * magnitude and direction of the change. Only the z axis is modified.
 *
 * The IPP describes the general position of the slices in space relative to an orientation vector
 * and in frame of refence.
 *
 * Formula is IPPz = (lastz - firstz) / total_slices.
 *
 * @param firstSlice
 * @param lastSlice
 * @param indx
 * @param totalSliceCount
 */
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

/**
 * Using one of the WADO instances, generate the missing instance metadata structures needed by the
 * Viewer to determine if 3D reconstruction is possible.
 *
 * This function uses the QIDO metadata to determine how many series to process and how many slices
 * for each series to prepare. The QIDO metadata is first casted to a `DicomStructureData` for easy
 * handling.
 *
 * The result is series => [first, last] >> [first, ..., last].
 *
 * @param instanceQIDOMeta
 * @param instanceWADOMeta
 */
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
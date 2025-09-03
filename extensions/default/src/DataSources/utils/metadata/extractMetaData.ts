/**
 * Tools for extracting key metadata items from QIDO and WADO queries such that it is digestible
 * by the viewer.
 */
import { getImageId } from '../getImageId';
import { DicomWebConfig } from '../dicomWebConfig';
import {
  DicomReferenceMetadata,
  DicomSeriesHeaderMetaData,
  DicomSeriesStructureData,
  DicomStructureData,
  DicomStudyMetaData,
  RawDicomInstances,
} from '../Types';
import {naturalizeDataset} from '../dicom'

/**
 * Takes a list of settled promises containing fulfilled promises and returns a list of lists of
 * fulfilled promises.
 *
 * The goal here is to take the data returned by `dicomweb-client`, which lacks type information and
 * begin adding type annotations.
 *
 * We also want to coerce the input into an array of instances.
 *
 * @param instances list of settled promises containing fulfilled promises
 */
export function dicomWebToRawDicomInstances(instances: Promise<any[]>|any[]): RawDicomInstances {
  const rawInstances = instances.value ? instances.value : instances
  return rawInstances.map((promise) => promise.value ? promise.value : promise);
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
    if (seriesInstances && typeof seriesInstances === 'object' && "value" in seriesInstances) {
      return seriesInstances.value.map((instance) => {
        naturalizedInstancesMetadata.push(naturalizeDataset(instance));
      });
    // If we are getting a list of lists of raw dicom instances from a wado client.
    } else if (Array.isArray(seriesInstances)) {
      return seriesInstances.map((instance) => {
        naturalizedInstancesMetadata.push(naturalizeDataset(instance));
      });
    // If we are getting a list of raw instances from a wado client.
    } else {
      return naturalizedInstancesMetadata.push(naturalizeDataset(seriesInstances));
    }
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
export function generateStudyMetaData(
  data: DicomSeriesStructureData,
  dicomWebConfig: DicomWebConfig
): DicomStudyMetaData
{
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

      instance.imageId = getImageId(
        instance,
        undefined,
        dicomWebConfig,
      );
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
    reference.ImagePositionPatient[2] = firstIPP[2] + indx * deltaIPP;
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
  instanceWADOMeta: RawDicomInstances
): DicomSeriesStructureData
{
  const newNaturalizedInstancesMetadata: DicomSeriesStructureData = [];
  const naturalizedInstancesMetadata= instanceWADOMeta.map(
    instances => dicomWebToDicomStructure(instances)
  );

  for(let i = 0; i < instanceQIDOMeta.length; i++) {
    const referenceMetaData = naturalizedInstancesMetadata[i];
    const [firstSlice, lastSlice] = referenceMetaData;
    const seriesInstances = instanceQIDOMeta[i];
    const newInstances: DicomStructureData = [];
    const instances = seriesInstances.value ? seriesInstances.value : seriesInstances;
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
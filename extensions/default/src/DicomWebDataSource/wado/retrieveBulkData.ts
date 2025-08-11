
import dcmjs from 'dcmjs';
import { fixBulkDataURI } from '../utils/fixBulkDataURI';

const { DicomMetaDictionary } = dcmjs.data;
const { naturalizeDataset } = DicomMetaDictionary;

import DICOMwebClient from 'dicomweb-client/types/api';
import {DicomWebConfig} from '../utils/dicomWebConfig';
import {DicomStructure} from '../utils/DicomTypes';

/**
 * Adds the retrieve bulkdata function to naturalized DICOM data.
 * This is done recursively, for sub-sequences.
 */
export function addRetrieveBulkDataNaturalized(
  naturalized: DicomStructure,
  client: DICOMwebClient,
  config: DicomWebConfig,
): DicomStructure {
  for (const key of Object.keys(naturalized)) {
    const value = naturalized[key];

    if (Array.isArray(value) && typeof value[0] === 'object') {
      // Fix recursive values
      const validValues = value.filter(Boolean);
      validValues.forEach(child => addRetrieveBulkDataNaturalized(child, client, config));
      continue;
    }

    // The value.Value will be set with the bulkdata read value
    // in which case it isn't necessary to re-read this.
    if (value && value.BulkDataURI && !value.Value) {
      // handle the scenarios where bulkDataURI is relative path
      fixBulkDataURI(value, naturalized, config);
      // Provide a method to fetch bulkdata
      value.retrieveBulkData = retrieveBulkData.bind(client, value);
    }
  }
  return naturalized;
}

/**
 * A bindable function that retrieves the bulk data against this as the
 * dicomweb client, and on the given value element.
 *
 * @param value - a bind value that stores the retrieve value to short circuit the
 *    next retrieve instance.
 * @param options - to allow specifying the content type.
 */
export function retrieveBulkData(
  value,
  options = {}
) {
  const { mediaType } = options;
  const useOptions = {
    // The bulkdata fetches work with either multipart or
    // singlepart, so set multipart to false to let the server
    // decide which type to respond with.
    multipart: false,
    BulkDataURI: value.BulkDataURI,
    mediaTypes: mediaType ? [{ mediaType }, { mediaType: 'application/octet-stream' }] : undefined,
    ...options,
  };
  return this.retrieveBulkData(useOptions).then(val => {
    // There are DICOM PDF cases where the first ArrayBuffer in the array is
    // the bulk data and DICOM video cases where the second ArrayBuffer is
    // the bulk data. Here we play it safe and do a find.
    const ret =
      (val instanceof Array && val.find(arrayBuffer => arrayBuffer?.byteLength)) || undefined;
    value.Value = ret;
    return ret;
  });
}

/**
 * naturalizes the dataset, and adds a retrieve bulkdata method
 * to any values containing BulkDataURI.
 * @param {*} instance
 * @param config
 * @returns naturalized dataset, with retrieveBulkData methods
 */
export function addRetrieveBulkData(
  instance: DicomStructure,
  client: DICOMwebClient,
  config: DicomWebConfig): DicomStructure
{
  const naturalized = naturalizeDataset(instance);

  // if we know the server doesn't use bulkDataURI, then don't
  if (!config.bulkDataURI?.enabled) {
    return naturalized;
  }

  return addRetrieveBulkDataNaturalized(naturalized, client, config);
}
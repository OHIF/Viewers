import FileLoaderService from './fileLoaderService';
import { DicomMetadataStore } from '@ohif/core';

const processFile = async file => {
  try {
    const fileLoaderService = new FileLoaderService(file);
    const imageId = fileLoaderService.addFile(file);
    const image = await fileLoaderService.loadFile(file, imageId);
    const dicomJSONDataset = await fileLoaderService.getDataset(image, imageId);

    DicomMetadataStore.addInstance(dicomJSONDataset);
  } catch (error) {
    console.log(error.name, ':Error when trying to load and process local files:', error.message);
  }
};

export default async function filesToStudies(files) {
  const processFilesPromises = files.map(processFile);
  await Promise.all(processFilesPromises);

  return DicomMetadataStore.getStudyInstanceUIDs();
}

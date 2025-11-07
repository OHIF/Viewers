import FileLoaderService from './fileLoaderService';
import { DicomMetadataStore } from '@ohif/core';

const processFile = async file => {
  try {
    console.log(`Processing file: ${file.name}, size: ${file.size}, type: ${file.type}`);
    const fileLoaderService = new FileLoaderService(file);
    const imageId = fileLoaderService.addFile(file);
    console.log(`Generated imageId: ${imageId}`);
    const image = await fileLoaderService.loadFile(file, imageId);
    console.log(`Loaded image, buffer size: ${image ? image.byteLength : 'null'}`);
    const dicomJSONDataset = await fileLoaderService.getDataset(image, imageId);

    DicomMetadataStore.addInstance(dicomJSONDataset);
    console.log(`Successfully added instance for ${file.name}`);
  } catch (error) {
    console.log(error.name, ':Error when trying to load and process local files:', error.message);
    console.error(error);
  }
};

export default async function filesToStudies(files) {
  const processFilesPromises = files.map(processFile);
  await Promise.all(processFilesPromises);

  return DicomMetadataStore.getStudyInstanceUIDs();
}

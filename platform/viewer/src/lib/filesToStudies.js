import FileLoaderService from './fileLoaders/fileLoaderService';

const processFile = async file => {
  const fileLoaderService = new FileLoaderService(file);
  const imageId = fileLoaderService.addFile(file);
  const image = await fileLoaderService.loadFile(file, imageId);
  const datasets = await fileLoaderService.getDataset(image, imageId);
  const studies = await fileLoaderService.getStudies(datasets, imageId);

  return studies;
};

export default async function filesToStudies(files) {
  const processFilesPromises = files.map(file => {
    return processFile(file);
  });

  const studies = await Promise.all(processFilesPromises);
  return FileLoaderService.groupSeries(studies.flat());
}

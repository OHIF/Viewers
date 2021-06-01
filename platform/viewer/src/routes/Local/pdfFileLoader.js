import cornerstoneWADOImageLoader from 'cornerstone-wado-image-loader';
import FileLoader from './fileLoader';

const PDFFileLoader = new (class extends FileLoader {
  fileType = 'application/pdf';
  loadFile(file, imageId) {
    return cornerstoneWADOImageLoader.wadouri.loadFileRequest(imageId);
  }

  getDataset(image, imageId) {
    const dataset = {};
    dataset.imageId = image.imageId || imageId;
    return dataset;
  }
})();

export default PDFFileLoader;

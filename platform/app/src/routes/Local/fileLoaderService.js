import dicomImageLoader from '@cornerstonejs/dicom-image-loader';

import FileLoader from './fileLoader';
import PDFFileLoader from './pdfFileLoader';
import DICOMFileLoader from './dicomFileLoader';

class FileLoaderService extends FileLoader {
  fileType;
  loader;
  constructor(file) {
    super();
    const fileType = file && file.type;
    this.loader = this.getLoader(fileType);
    this.fileType = this.loader.fileType;
  }

  addFile(file) {
    return dicomImageLoader.wadouri.fileManager.add(file);
  }

  loadFile(file, imageId) {
    return this.loader.loadFile(file, imageId);
  }

  getDataset(image, imageId) {
    return this.loader.getDataset(image, imageId);
  }

  getLoader(fileType) {
    if (fileType === 'application/pdf') {
      return PDFFileLoader;
    } else {
      // Default to dicom loader
      return DICOMFileLoader;
    }
  }
}

export default FileLoaderService;

import dcmjs from 'dcmjs';
import dicomImageLoader from '@cornerstonejs/dicom-image-loader';
import FileLoader from './fileLoader';

const DICOMFileLoader = new (class extends FileLoader {
  fileType = 'application/dicom';
  loadFile(file, imageId) {
    return dicomImageLoader.wadouri.loadFileRequest(imageId);
  }

  getDataset(image, imageId) {
    const dicomData = dcmjs.data.DicomMessage.readFile(image);

    const dataset = dcmjs.data.DicomMetaDictionary.naturalizeDataset(dicomData.dict);

    dataset.url = imageId;

    dataset._meta = dcmjs.data.DicomMetaDictionary.namifyDataset(dicomData.meta);

    dataset.AvailableTransferSyntaxUID =
      dataset.AvailableTransferSyntaxUID || dataset._meta.TransferSyntaxUID?.Value?.[0];

    return dataset;
  }
})();

export default DICOMFileLoader;

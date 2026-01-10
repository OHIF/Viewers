import dcmjs from 'dcmjs';
import dicomImageLoader from '@cornerstonejs/dicom-image-loader';
import FileLoader from './fileLoader';

const DICOMFileLoader = new (class extends FileLoader {
  fileType = 'application/dicom';
  loadFile(file, imageId) {
    return dicomImageLoader.wadouri.loadFileRequest(imageId);
  }

  getDataset(image, imageId) {
    let invalidVRTypeDetected = false;
    const warnings = [];

    // Intercept console warnings to detect "Invalid vr type" errors
    const originalWarn = console.warn;
    console.warn = (...args) => {
      const message = args.join(' ');
      warnings.push(message);
      // Check for invalid VR type errors
      if (message.includes('Invalid vr type') || message.includes('Invalid VR type') || message.includes('using UN')) {
        invalidVRTypeDetected = true;
      }
      // Still call original warn to maintain normal logging
      originalWarn.apply(console, args);
    };

    try {
      const dicomData = dcmjs.data.DicomMessage.readFile(image);

      const dataset = dcmjs.data.DicomMetaDictionary.naturalizeDataset(dicomData.dict);

      dataset.url = imageId;
      dataset.imageId = imageId; // Set imageId for proper file retrieval

      dataset._meta = dcmjs.data.DicomMetaDictionary.namifyDataset(dicomData.meta);

      dataset.AvailableTransferSyntaxUID =
        dataset.AvailableTransferSyntaxUID || dataset._meta.TransferSyntaxUID?.Value?.[0];

      // Mark series as problematic if invalid VR type was detected
      if (invalidVRTypeDetected && dataset.SeriesInstanceUID) {
        // Import here to avoid circular dependency
        const { DicomMetadataStore } = require('@ohif/core');
        if (DicomMetadataStore && DicomMetadataStore.isSeriesProblematic) {
          // The series will be marked in addInstance, but we can also mark it here
          // by storing a flag on the dataset
          dataset._hasInvalidVRTypes = true;
        }
        console.warn(`DICOM file has invalid VR types: ${dataset.SeriesInstanceUID}`, {
          SeriesInstanceUID: dataset.SeriesInstanceUID,
          warnings: warnings.filter(w => w.includes('Invalid vr type') || w.includes('Invalid VR type') || w.includes('using UN')),
        });
      }

      return dataset;
    } finally {
      // Restore original console.warn
      console.warn = originalWarn;
    }
  }
})();

export default DICOMFileLoader;

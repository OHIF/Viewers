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

  getStudies(dataset, imageId) {
    return this.getDefaultStudy(imageId);
  }

  getDefaultStudy(imageId) {
    const study = {
      studyInstanceUid: '',
      studyDate: '',
      studyTime: '',
      accessionNumber: '',
      referringPhysicianName: '',
      patientName: '',
      patientId: '',
      patientBirthdate: '',
      patientSex: '',
      studyId: '',
      studyDescription: '',
      seriesList: [
        {
          seriesInstanceUid: '',
          seriesDescription: '',
          seriesNumber: '',
          instances: [
            {
              sopInstanceUid: '',
              sopClassUid: '1.2.840.10008.5.1.4.1.1.104.1',
              rows: '',
              columns: '',
              numberOfFrames: 0,
              instanceNumber: 1,
              getImageId: () => imageId,
              isLocalFile: true,
            },
          ],
        },
      ],
    };

    return study;
  }
})();

export default PDFFileLoader;

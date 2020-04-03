import FileLoader from './fileLoader';
import { getCornerstoneWADOImageLoader } from '../../utils/cornerstoneWADOImageLoader';

const PDFFileLoader = new (class extends FileLoader {
  fileType = 'application/pdf';
  async loadFile(file, imageId) {
    const cornerstoneWADOImageLoader = await getCornerstoneWADOImageLoader();
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
      StudyInstanceUID: '',
      StudyDate: '',
      StudyTime: '',
      AccessionNumber: '',
      ReferringPhysicianName: '',
      PatientName: '',
      PatientID: '',
      PatientBirthdate: '',
      PatientSex: '',
      StudyId: '',
      StudyDescription: '',
      series: [
        {
          SeriesInstanceUID: '',
          SeriesDescription: '',
          SeriesNumber: '',
          instances: [
            {
              metadata: {
                SOPInstanceUID: '',
                SOPClassUID: '1.2.840.10008.5.1.4.1.1.104.1',
                Rows: '',
                Columns: '',
                NumberOfFrames: 0,
                InstanceNumber: 1,
              },
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

import cornerstoneWADOImageLoader from 'cornerstone-wado-image-loader';
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

  static groupSeries(studies) {
    const groupBy = (list, groupByKey, listKey) => {
      let nonKeyCounter = 1;

      return list.reduce((acc, obj) => {
        let key = obj[groupByKey];
        const list = obj[listKey];

        // in case key not found, group it using counter
        key = !!key ? key : '' + nonKeyCounter++;

        if (!acc[key]) {
          acc[key] = { ...obj };
          acc[key][listKey] = [];
        }

        acc[key][listKey].push(...list);

        return acc;
      }, {});
    };

    const studiesGrouped = Object.values(
      groupBy(studies, 'StudyInstanceUID', 'series')
    );

    const result = studiesGrouped.map(studyGroup => {
      const seriesGrouped = groupBy(
        studyGroup.series,
        'SeriesInstanceUID',
        'instances'
      );
      studyGroup.series = Object.values(seriesGrouped);

      return studyGroup;
    });

    return result;
  }

  addFile(file) {
    return cornerstoneWADOImageLoader.wadouri.fileManager.add(file);
  }

  loadFile(file, imageId) {
    return this.loader.loadFile(file, imageId);
  }

  getDataset(image, imageId) {
    return this.loader.getDataset(image, imageId);
  }

  getStudies(dataset, imageId) {
    return this.loader.getStudies(dataset, imageId);
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

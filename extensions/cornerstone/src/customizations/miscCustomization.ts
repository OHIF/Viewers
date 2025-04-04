import { CinePlayer } from '@ohif/ui';
import DicomUpload from '../components/DicomUpload/DicomUpload';

export default {
  cinePlayer: CinePlayer,
  autoCineModalities: ['OT', 'US'],
  'panelMeasurement.disableEditing': false,
  onBeforeSRAddMeasurement: ({ measurement, StudyInstanceUID, SeriesInstanceUID }) => {
    return measurement;
  },
  onBeforeDicomStore: ({ dicomDict, measurementData, naturalizedReport }) => {
    return dicomDict;
  },
  dicomUploadComponent: DicomUpload,
  codingValues: {},
};

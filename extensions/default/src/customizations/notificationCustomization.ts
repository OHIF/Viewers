import i18n from '@ohif/i18n';
import { ViewportDialog } from '@ohif/ui-next';

const beginTrackingMessage = i18n.t('MeasurementTable:Track measurements for this series?');
const trackNewSeriesMessage = i18n.t('Do you want to add this measurement to the existing report?');
const discardSeriesMessage = i18n.t(
  'You have existing tracked measurements. What would you like to do with your existing tracked measurements?'
);
const trackNewStudyMessage = i18n.t('MeasurementTable:Track measurements for this series?');
const discardStudyMessage = i18n.t(
  'Measurements cannot span across multiple studies. Do you want to save your tracked measurements?'
);
const hydrateSRMessage = i18n.t('Do you want to continue tracking measurements for this study?');
const hydrateRTMessage = i18n.t('Do you want to open this Segmentation?');
const hydrateSEGMessage = i18n.t('Do you want to open this Segmentation?');
const discardDirtyMessage = i18n.t('There are unsaved measurements. Do you want to save it?');

export default {
  'ui.notificationComponent': ViewportDialog,
  'viewportNotification.beginTrackingMessage': beginTrackingMessage,
  'viewportNotification.trackNewSeriesMessage': trackNewSeriesMessage,
  'viewportNotification.discardSeriesMessage': discardSeriesMessage,
  'viewportNotification.trackNewStudyMessage': trackNewStudyMessage,
  'viewportNotification.discardStudyMessage': discardStudyMessage,
  'viewportNotification.hydrateSRMessage': hydrateSRMessage,
  'viewportNotification.hydrateRTMessage': hydrateRTMessage,
  'viewportNotification.hydrateSEGMessage': hydrateSEGMessage,
  'viewportNotification.discardDirtyMessage': discardDirtyMessage,
};

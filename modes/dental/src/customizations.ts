import i18n from '@ohif/i18n';

/**
 * Dental mode customizations
 * Extends the study browser with dental-specific features
 */
export default {
  /**
   * Thumbnail menu items for dental mode
   * Adds duplicate image functionality to easily compare images side-by-side
   */
  'studyBrowser.thumbnailMenuItems': [
    {
      id: 'tagBrowser',
      label: i18n.t('StudyBrowser:Tag Browser'),
      iconName: 'DicomTagBrowser',
      commands: 'openDICOMTagViewer',
    },
    {
      id: 'duplicateImage',
      label: 'Duplicate to Next Viewport',
      iconName: 'ViewportViews',
      commands: 'duplicateImageToNextViewport',
    },
    {
      id: 'addAsLayer',
      label: i18n.t('StudyBrowser:Add as Layer'),
      iconName: 'ViewportViews',
      commands: 'addDisplaySetAsLayer',
    },
  ],
};

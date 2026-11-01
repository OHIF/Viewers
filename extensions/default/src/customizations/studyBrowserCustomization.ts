import { utils } from '@ohif/core';
import i18n from '@ohif/i18n';
const { getDateTimeSortKey } = utils;

/**
 * Orders by the given key, lowest first, and returns 0 when the keys are
 * equal, so that the study browser breaks the tie with its default order.
 */
const byKey = keyOf => (a, b) => {
  const keyA = keyOf(a);
  const keyB = keyOf(b);
  return keyA === keyB ? 0 : keyA < keyB ? -1 : 1;
};

// A series with no number or no date sorts first.
const seriesNumberKey = displaySet => {
  const seriesNumber = Number(displaySet?.SeriesNumber);
  return Number.isFinite(seriesNumber) ? seriesNumber : -Infinity;
};
const seriesDateTimeKey = displaySet =>
  getDateTimeSortKey(displaySet?.SeriesDate, displaySet?.SeriesTime);

export default {
  'studyBrowser.studyMenuItems': [],
  'studyBrowser.thumbnailMenuItems': [
    {
      id: 'tagBrowser',
      label: i18n.t('StudyBrowser:Tag Browser'),
      iconName: 'DicomTagBrowser',
      commands: 'openDICOMTagViewer',
    },
    {
      id: 'addAsLayer',
      label: i18n.t('StudyBrowser:Add as Layer'),
      iconName: 'ViewportViews',
      commands: 'addDisplaySetAsLayer',
    },
  ],
  'studyBrowser.sortFunctions': [
    {
      label: i18n.t('StudyBrowser:Series Number'),
      sortFunction: byKey(seriesNumberKey),
    },
    {
      label: i18n.t('StudyBrowser:Series Date'),
      sortFunction: byKey(seriesDateTimeKey),
    },
  ],
  'studyBrowser.viewPresets': [
    {
      id: 'list',
      iconName: 'ListView',
      selected: false,
    },
    {
      id: 'thumbnails',
      iconName: 'ThumbnailView',
      selected: true,
    },
  ],
  'studyBrowser.studyMode': 'all',
  'studyBrowser.thumbnailDoubleClickCallback': {
    callbacks: [
      ({ activeViewportId, servicesManager, commandsManager, isHangingProtocolLayout }) =>
        async displaySetInstanceUID => {
          const { hangingProtocolService, uiNotificationService } = servicesManager.services;
          let updatedViewports = [];
          const viewportId = activeViewportId;

          try {
            updatedViewports = hangingProtocolService.getViewportsRequireUpdate(
              viewportId,
              displaySetInstanceUID,
              isHangingProtocolLayout
            );
          } catch (error) {
            console.warn(error);
            uiNotificationService.show({
              title: i18n.t('StudyBrowser:Thumbnail Double Click'),
              message: i18n.t(
                'StudyBrowser:The selected display sets could not be added to the viewport.'
              ),
              type: 'error',
              duration: 3000,
            });
          }

          commandsManager.run('setDisplaySetsForViewports', {
            viewportsToUpdate: updatedViewports,
          });
        },
    ],
  },
};

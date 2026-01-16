import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { Button, Header, Icons, useModal } from '@ohif/ui-next';
import { useSystem, DicomMetadataStore } from '@ohif/core';
import { Toolbar } from '../Toolbar/Toolbar';
import HeaderPatientInfo from './HeaderPatientInfo';
import { PatientInfoVisibility } from './HeaderPatientInfo/HeaderPatientInfo';
import { preserveQueryParameters } from '@ohif/app';
import { Types } from '@ohif/core';

/**
 * Component to display Cast subscriber information next to the OHIF logo
 */
function CastSubscriberInfo({ servicesManager }: { servicesManager: AppTypes.ServicesManager }) {
  const [castInfo, setCastInfo] = React.useState<{
    subscriberName: string;
    topic: string;
    hubName: string;
    subscribed: boolean;
  } | null>(null);

  React.useEffect(() => {
    const castService = servicesManager.services.castService;
    if (!castService) {
      return;
    }

    const updateCastInfo = () => {
      const hub = castService.getHub();
      if (hub && hub.subscribed) {
        setCastInfo({
          subscriberName: hub.subscriberName || '',
          topic: hub.topic || '',
          hubName: hub.name || '',
          subscribed: hub.subscribed || false,
        });
      } else {
        setCastInfo(null);
      }
    };

    // Initial update
    updateCastInfo();

    // Subscribe to hub events to update when subscription changes
    const { HUB_SUBSCRIBED, HUB_UNSUBSCRIBED } = castService.EVENTS;
    const { unsubscribe: unsubscribeSubscribed } = castService.subscribe(
      HUB_SUBSCRIBED,
      updateCastInfo
    );
    const { unsubscribe: unsubscribeUnsubscribed } = castService.subscribe(
      HUB_UNSUBSCRIBED,
      updateCastInfo
    );

    // Poll for changes (in case events don't fire)
    const interval = setInterval(updateCastInfo, 2000);

    return () => {
      unsubscribeSubscribed();
      unsubscribeUnsubscribed();
      clearInterval(interval);
    };
  }, [servicesManager]);

  if (!castInfo || !castInfo.subscribed) {
    return null;
  }

  return (
    <div className="text-primary-active ml-3 flex items-center text-base">
      <span className="font-medium">
        {castInfo.subscriberName || castInfo.topic || castInfo.hubName}
      </span>
    </div>
  );
}

function ViewerHeader({ appConfig }: withAppTypes<{ appConfig: AppTypes.Config }>) {
  const { servicesManager, extensionManager, commandsManager } = useSystem();
  const { customizationService } = servicesManager.services;

  const navigate = useNavigate();
  const location = useLocation();

  const onClickReturnButton = () => {
    // Publish imagingstudy-close events before navigating away
    publishImagingStudyCloseEvents(location, servicesManager);

    const { pathname } = location;
    const dataSourceIdx = pathname.indexOf('/', 1);

    const dataSourceName = pathname.substring(dataSourceIdx + 1);
    const existingDataSource = extensionManager.getDataSources(dataSourceName);

    const searchQuery = new URLSearchParams();
    if (dataSourceIdx !== -1 && existingDataSource) {
      searchQuery.append('datasources', pathname.substring(dataSourceIdx + 1));
    }
    preserveQueryParameters(searchQuery);

    navigate({
      pathname: '/',
      search: decodeURIComponent(searchQuery.toString()),
    });
  };

  const { t } = useTranslation();
  const { show } = useModal();

  const AboutModal = customizationService.getCustomization(
    'ohif.aboutModal'
  ) as Types.MenuComponentCustomization;

  const UserPreferencesModal = customizationService.getCustomization(
    'ohif.userPreferencesModal'
  ) as Types.MenuComponentCustomization;

  const menuOptions = [
    {
      title: AboutModal?.menuTitle ?? t('Header:About'),
      icon: 'info',
      onClick: () =>
        show({
          content: AboutModal,
          title: AboutModal?.title ?? t('AboutModal:About OHIF Viewer'),
          containerClassName: AboutModal?.containerClassName ?? 'max-w-md',
        }),
    },
    {
      title: UserPreferencesModal.menuTitle ?? t('Header:Preferences'),
      icon: 'settings',
      onClick: () =>
        show({
          content: UserPreferencesModal,
          title: UserPreferencesModal.title ?? t('UserPreferencesModal:User preferences'),
          containerClassName:
            UserPreferencesModal?.containerClassName ?? 'flex max-w-4xl p-6 flex-col',
        }),
    },
    {
      title: 'Cast API',
      icon: 'external-link',
      onClick: () => {
        window.open(
          'https://cast-hub-g6abetanhjesb6cx.westeurope-01.azurewebsites.net/api/hub/admin',
          '_blank'
        );
      },
    },
  ];

  if (appConfig.oidc) {
    menuOptions.push({
      title: t('Header:Logout'),
      icon: 'power-off',
      onClick: async () => {
        navigate(`/logout?redirect_uri=${encodeURIComponent(window.location.href)}`);
      },
    });
  }
  // Create a custom logo component that includes the cast subscriber info
  return (
    <Header
      menuOptions={menuOptions}
      isReturnEnabled={!!appConfig.showStudyList}
      onClickReturnButton={onClickReturnButton}
      WhiteLabeling={appConfig.whiteLabeling}
      subscriberName={servicesManager.services.castService?.hub?.subscriberName}
      Secondary={<Toolbar buttonSection="secondary" />}
      PatientInfo={
        appConfig.showPatientInfo !== PatientInfoVisibility.DISABLED && (
          <HeaderPatientInfo
            servicesManager={servicesManager}
            appConfig={appConfig}
          />
        )
      }
      UndoRedo={
        <div className="text-primary flex cursor-pointer items-center">
          <Button
            variant="ghost"
            className="hover:bg-primary-dark"
            onClick={() => {
              commandsManager.run('undo');
            }}
          >
            <Icons.Undo className="" />
          </Button>
          <Button
            variant="ghost"
            className="hover:bg-primary-dark"
            onClick={() => {
              commandsManager.run('redo');
            }}
          >
            <Icons.Redo className="" />
          </Button>
        </div>
      }
    >
      <div className="relative flex justify-center gap-[4px]">
        <Toolbar buttonSection="primary" />
      </div>
    </Header>
  );
}

/**
 * Publishes imagingstudy-close events for currently open studies
 * @param {object} location - React Router location object
 * @param {object} servicesManager - Services manager instance
 */
function publishImagingStudyCloseEvents(location, servicesManager) {
  try {
    const castService = servicesManager.services.castService;
    if (!castService) {
      console.debug('ViewerHeader: CastService not available, skipping imagingstudy-close');
      return;
    }

    const hub = castService.getHub();
    if (!hub || !hub.subscribed || !hub.name) {
      console.debug(
        'ViewerHeader: Hub not configured or not subscribed, skipping imagingstudy-close'
      );
      return;
    }

    // Extract study instance UIDs from URL query parameters
    const searchParams = new URLSearchParams(location.search);
    const studyInstanceUIDs = searchParams.getAll('StudyInstanceUIDs');

    if (!studyInstanceUIDs || studyInstanceUIDs.length === 0) {
      console.debug('ViewerHeader: No StudyInstanceUIDs found in URL, skipping imagingstudy-close');
      return;
    }

    // Publish event for each study
    studyInstanceUIDs.forEach(studyInstanceUID => {
      const study = DicomMetadataStore.getStudy(studyInstanceUID);
      if (!study) {
        console.warn('ViewerHeader: Study not found in metadata store:', studyInstanceUID);
        return;
      }

      // Get patient information from the first instance of the first series
      let patientId = '';
      let patientName = '';
      let accessionNumber = '';

      if (study.series && study.series.length > 0) {
        const firstSeries = study.series[0];
        if (firstSeries.instances && firstSeries.instances.length > 0) {
          const firstInstance = firstSeries.instances[0];
          patientId = firstInstance.PatientID || '';
          patientName = firstInstance.PatientName || '';
          accessionNumber = firstInstance.AccessionNumber || study.AccessionNumber || '';
        }
      }

      const patientIdentifierValue = patientId || 'unknown';

      const castMessage = {
        timestamp: '',
        id: '',
        event: {
          'hub.topic': '',
          'hub.event': 'imagingstudy-close',
          context: [
            {
              key: 'patient',
              resource: {
                resourceType: 'Patient',
                id: patientIdentifierValue,
                identifier: [
                  {
                    system: 'urn:oid:2.16.840.1.113883.4.2',
                    value: patientIdentifierValue,
                  },
                ],
                name: patientName ? [{ text: patientName }] : undefined,
              },
            },
            {
              key: 'study',
              resource: {
                resourceType: 'ImagingStudy',
                id: studyInstanceUID,
                uid: 'urn:oid:' + studyInstanceUID,
                identifier: accessionNumber
                  ? [
                      {
                        system: 'urn:oid:2.16.840.1.113883.4.2',
                        value: accessionNumber,
                      },
                    ]
                  : [],
                patient: {
                  reference: 'Patient/' + patientIdentifierValue,
                },
                status: 'available',
              },
            },
          ],
        },
      };

      console.debug('ViewerHeader: Publishing imagingstudy-close for study:', studyInstanceUID);
      castService.castPublish(castMessage, hub).catch(err => {
        console.warn('ViewerHeader: Failed to publish imagingstudy-close event:', err);
      });
    });
  } catch (error) {
    // Silently fail if cast extension is not available
    console.debug('ViewerHeader: Could not publish imagingstudy-close events:', error.message);
  }
}

export default ViewerHeader;

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAppConfig } from '@state';
import {
  Header,
  Icons,
  useModal,
  Onboarding,
  InvestigationalUseDialog,
} from '@ohif/ui-next';
import { Types as coreTypes } from '@ohif/core';

/**
 * Landing route when `showStudyList` is false: app header with an empty main area.
 * Study list remains at `appConfig.studyListPath` (default `/worklist`).
 */
type CastHubSlice = {
  topic?: string;
  subscriberName?: string;
  hub_endpoint?: string;
};

/** Supports OHIF CastService (`getHub` includes topic) and @cornerstonejs/cast wrapper (`getSessionConfig().topic`). */
type CastServiceLike = {
  getHub: () => CastHubSlice;
  getSessionConfig?: () => { topic?: string; subscriberName?: string };
};

function HomeShell({ servicesManager }: withAppTypes) {
  const [appConfig] = useAppConfig();
  const navigate = useNavigate();
  const { show } = useModal();
  const { t } = useTranslation();
  const { customizationService } = servicesManager.services;
  const castService = (servicesManager.services as { castService?: CastServiceLike }).castService;

  const [liveCastTopic, setLiveCastTopic] = React.useState('');

  React.useEffect(() => {
    if (!appConfig?.cast || !castService?.getHub) {
      setLiveCastTopic('');
      return;
    }

    const readTopic = () => {
      const fromSession = castService.getSessionConfig?.()?.topic?.trim() ?? '';
      const fromHub = castService.getHub()?.topic?.trim() ?? '';
      const fromUrl =
        typeof window !== 'undefined'
          ? new URLSearchParams(window.location.search).get('topic')?.trim() ?? ''
          : '';
      const fromStorage =
        typeof window !== 'undefined'
          ? window.sessionStorage.getItem('ohif.cast.sessionTopic')?.trim() ?? ''
          : '';
      const next = fromSession || fromHub || fromUrl || fromStorage;
      setLiveCastTopic(prev => (prev === next ? prev : next));
    };

    readTopic();
    const id = window.setInterval(readTopic, 800);
    return () => window.clearInterval(id);
  }, [appConfig?.cast, castService]);

  const AboutModal = customizationService.getCustomization(
    'ohif.aboutModal'
  ) as coreTypes.MenuComponentCustomization;
  const UserPreferencesModal = customizationService.getCustomization(
    'ohif.userPreferencesModal'
  ) as coreTypes.MenuComponentCustomization;

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
          content: UserPreferencesModal as React.ComponentType,
          title: UserPreferencesModal.title ?? t('UserPreferencesModal:User preferences'),
          containerClassName:
            UserPreferencesModal?.containerClassName ?? 'flex max-w-4xl p-6 flex-col',
        }),
    },
  ];

  if (appConfig?.cast) {
    menuOptions.push(
      {
        title: 'Conferencing',
        icon: 'conferencing',
        onClick: () => {
          const hub = castService?.getHub?.();
          const session = castService?.getSessionConfig?.();
          const topic =
            session?.topic?.trim() || hub?.topic?.trim() || '';
          const subscriberName = session?.subscriberName || hub?.subscriberName || '';
          const hubEndpoint = hub?.hub_endpoint || '';
          const params = new URLSearchParams();
          if (topic) params.append('topic', topic);
          if (subscriberName) params.append('subscriberName', subscriberName);
          const queryString = params.toString();
          const url = `${hubEndpoint}/conference-client${queryString ? `?${queryString}` : ''}`;

          const ConferenceIframe = () => (
            <div className="h-[700px] w-[400px]">
              <iframe
                src={url}
                className="h-full w-full border-0"
                title="Conference Client"
                allow="autoplay; fullscreen; picture-in-picture"
                allowFullScreen
              />
            </div>
          );

          show({
            content: ConferenceIframe,
            title: undefined,
            containerClassName: 'w-[600px] pt-4 pr-4 pb-0 pl-0',
          });
        },
      },
      {
        title: 'Cast Test Cient',
        icon: '3dslicer',
        onClick: () => {
          const hub = castService?.getHub?.();
          const session = castService?.getSessionConfig?.();
          const topic = session?.topic?.trim() || hub?.topic?.trim() || '';
          const hubEndpoint = hub?.hub_endpoint || '';
          const params = new URLSearchParams();
          if (topic) params.append('topic', topic);
          const queryString = params.toString();
          const url = `${hubEndpoint}/test-client${queryString ? `?${queryString}` : ''}`;
          window.open(url, '_blank');
        },
      },
      {
        title: 'Cast Admin Portal',
        icon: '3dslicer',
        onClick: () => {
          const hubEndpoint = castService?.getHub?.()?.hub_endpoint || '';
          const url = `${hubEndpoint}/admin`;
          window.open(url, '_blank');
        },
      }
    );
  }

  if (appConfig.oidc) {
    menuOptions.push({
      icon: 'power-off',
      title: t('Header:Logout'),
      onClick: () => {
        navigate(`/logout?redirect_uri=${encodeURIComponent(window.location.href)}`);
      },
    });
  }

  const castTopic = appConfig?.cast ? liveCastTopic : '';

  const whiteLabeling = appConfig.whiteLabeling;
  const logoWithTopic =
    castTopic || whiteLabeling?.createLogoComponentFn
      ? {
          ...whiteLabeling,
          createLogoComponentFn: (R: typeof React, props: unknown) => (
            <div className="flex min-w-0 max-w-[min(70vw,560px)] items-center gap-3">
              {whiteLabeling?.createLogoComponentFn?.(R, props) ?? <Icons.OHIFLogo />}
              {castTopic ? (
                <span
                  className="truncate text-base font-medium text-white"
                  title={castTopic}
                >
                  {castTopic}
                </span>
              ) : null}
            </div>
          ),
        }
      : whiteLabeling;

  return (
    <div className="bg-black flex h-screen flex-col">
      <Header
        isSticky
        menuOptions={menuOptions}
        isReturnEnabled={false}
        WhiteLabeling={logoWithTopic}
      />
      <Onboarding />
      <InvestigationalUseDialog dialogConfiguration={appConfig?.investigationalUseDialog} />
      <div className="relative z-10 flex flex-1 flex-col items-start justify-end bg-black pb-6 pl-6 pr-6">
        <p className="max-w-xl text-left text-base leading-relaxed text-white">
          This is the Image Display (ID) home screen as defined in{' '}
          <a
            href="https://build.fhir.org/ig/HL7/fhircast-docs/4-2-2-multitab-considerations.html"
            className="text-blue-400 underline underline-offset-2 hover:text-blue-300"
            target="_blank"
            rel="noopener noreferrer"
          >
            multitab considerations
          </a>
          .
          <br />
          The viewer study list is available under /worklist.
        </p>
      </div>
    </div>
  );
}

export default HomeShell;

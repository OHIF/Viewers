import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { DentalPreferences } from '../preferences/dentalPreferences';
import {
  DentalLayoutContext,
  DentalViewerState,
  normalizeDentalViewerState,
} from './dentalViewerState';
import {
  DentalViewerStateAuthError,
  createDentalViewerStateApi,
} from './dentalViewerStateApi';

export type DentalViewerStateStatus = 'idle' | 'loading' | 'saved' | 'unsaved' | 'locked';

type UseDentalViewerStateProps = {
  appConfig: AppTypes.Config;
  servicesManager: AppTypes.ServicesManager;
  preferences: DentalPreferences;
  applyPreferences: (preferences: DentalPreferences) => void;
};

type DentalBackendConfig = {
  baseUrl: string;
  authToken: string;
};

function getDentalBackendConfig(appConfig: AppTypes.Config): DentalBackendConfig {
  const dentalConfig = (appConfig as AppTypes.Config & { dental?: Record<string, string> })?.dental;

  return {
    baseUrl:
      dentalConfig?.viewerStateApiUrl ||
      dentalConfig?.backendUrl ||
      'http://localhost:4007/api/dental',
    authToken:
      dentalConfig?.viewerStateAuthToken ||
      dentalConfig?.backendAuthToken ||
      'dev-dental-token',
  };
}

function getStudyInstanceUID(displaySetService): string | undefined {
  const displaySet = displaySetService.getActiveDisplaySets?.()?.[0];
  const instance = displaySet?.instances?.[0] || displaySet?.instance;

  return displaySet?.StudyInstanceUID || instance?.StudyInstanceUID;
}

function getLayoutContext(servicesManager: AppTypes.ServicesManager): DentalLayoutContext {
  const { viewportGridService, hangingProtocolService } = servicesManager.services;
  const viewportGridState = viewportGridService?.getState?.();
  const hangingProtocolState = hangingProtocolService?.getState?.();
  const viewports = viewportGridState?.viewports || new Map();
  const viewportIds = Array.from(viewports.keys ? viewports.keys() : Object.keys(viewports));
  const stage = hangingProtocolState?.stage;

  return {
    activeViewportId: viewportGridState?.activeViewportId,
    viewportIds,
    protocolId: hangingProtocolState?.protocolId,
    stageId: stage?.id,
  };
}

export function useDentalViewerState({
  appConfig,
  servicesManager,
  preferences,
  applyPreferences,
}: UseDentalViewerStateProps) {
  const { displaySetService, viewportGridService } = servicesManager.services;
  const [studyInstanceUID, setStudyInstanceUID] = useState(() =>
    getStudyInstanceUID(displaySetService)
  );
  const [status, setStatus] = useState<DentalViewerStateStatus>('idle');
  const [lastError, setLastError] = useState<string | null>(null);
  const [loadedStudyUID, setLoadedStudyUID] = useState<string | null>(null);
  const [layoutRevision, setLayoutRevision] = useState(0);
  const lockedRef = useRef(false);
  const skipNextSaveRef = useRef(false);
  const saveTimerRef = useRef<ReturnType<typeof window.setTimeout> | null>(null);

  const backendConfig = useMemo(() => getDentalBackendConfig(appConfig), [appConfig]);
  const api = useMemo(() => createDentalViewerStateApi(backendConfig), [backendConfig]);

  const refreshStudyInstanceUID = useCallback(() => {
    setStudyInstanceUID(current => getStudyInstanceUID(displaySetService) || current);
  }, [displaySetService]);

  useEffect(() => {
    refreshStudyInstanceUID();

    const subscriptions = [
      displaySetService.subscribe?.(
        displaySetService.EVENTS.DISPLAY_SETS_ADDED,
        refreshStudyInstanceUID
      ),
      displaySetService.subscribe?.(
        displaySetService.EVENTS.DISPLAY_SETS_CHANGED,
        refreshStudyInstanceUID
      ),
    ].filter(Boolean);

    return () => {
      subscriptions.forEach(({ unsubscribe }) => unsubscribe());
    };
  }, [displaySetService, refreshStudyInstanceUID]);

  useEffect(() => {
    if (!studyInstanceUID || lockedRef.current) {
      return;
    }

    let cancelled = false;
    setStatus('loading');
    setLastError(null);

    api
      .load(studyInstanceUID)
      .then(remoteState => {
        if (cancelled) {
          return;
        }

        if (remoteState) {
          const normalized = normalizeDentalViewerState(remoteState);
          applyPreferences(normalized);
        }

        skipNextSaveRef.current = true;
        setLoadedStudyUID(studyInstanceUID);
        setStatus('saved');
      })
      .catch(error => {
        if (cancelled) {
          return;
        }

        if (error instanceof DentalViewerStateAuthError) {
          lockedRef.current = true;
          setStatus('locked');
          setLastError('Dental state locked');
          return;
        }

        skipNextSaveRef.current = true;
        setLoadedStudyUID(studyInstanceUID);
        setStatus('unsaved');
        setLastError('Dental state not saved');
      });

    return () => {
      cancelled = true;
    };
  }, [api, applyPreferences, studyInstanceUID]);

  useEffect(() => {
    if (!studyInstanceUID || loadedStudyUID !== studyInstanceUID || lockedRef.current) {
      return;
    }

    if (skipNextSaveRef.current) {
      skipNextSaveRef.current = false;
      return;
    }

    if (saveTimerRef.current) {
      window.clearTimeout(saveTimerRef.current);
    }

    setStatus('unsaved');
    saveTimerRef.current = window.setTimeout(() => {
      const state: DentalViewerState = {
        ...preferences,
        layoutContext: getLayoutContext(servicesManager),
      };

      api
        .save(studyInstanceUID, state)
        .then(() => {
          setStatus('saved');
          setLastError(null);
        })
        .catch(error => {
          if (error instanceof DentalViewerStateAuthError) {
            lockedRef.current = true;
            setStatus('locked');
            setLastError('Dental state locked');
            return;
          }

          setStatus('unsaved');
          setLastError('Dental state not saved');
        });
    }, 400);

    return () => {
      if (saveTimerRef.current) {
        window.clearTimeout(saveTimerRef.current);
      }
    };
  }, [api, layoutRevision, loadedStudyUID, preferences, servicesManager, studyInstanceUID]);

  useEffect(() => {
    if (!viewportGridService || !studyInstanceUID || lockedRef.current) {
      return;
    }

    const subscription = viewportGridService.subscribe?.(
      viewportGridService.EVENTS.GRID_STATE_CHANGED,
      () => {
        setLayoutRevision(current => current + 1);
        setStatus(current => (current === 'locked' ? current : 'unsaved'));
      }
    );

    return () => {
      subscription?.unsubscribe();
    };
  }, [studyInstanceUID, viewportGridService]);

  return {
    status,
    lastError,
    studyInstanceUID,
  };
}

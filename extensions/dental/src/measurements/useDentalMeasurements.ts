import { useCallback, useEffect, useMemo, useRef } from 'react';

import { DentalPreferences } from '../preferences/dentalPreferences';
import {
  createDentalMeasurement,
  DentalMeasurement,
  updateDentalMeasurement,
} from './dentalMeasurement';
import {
  DentalMeasurementPresetId,
  getDentalMeasurementPreset,
} from './dentalMeasurementPresets';
import { DentalMeasurementsService } from './DentalMeasurementsService';
import {
  DentalMeasurementsAuthError,
  createDentalMeasurementsApi,
} from './dentalMeasurementsApi';

type PendingMeasurement = {
  presetId: DentalMeasurementPresetId;
  toothId: string;
  note: string;
};

type UseDentalMeasurementsOptions = {
  appConfig: AppTypes.Config;
  commandsManager: AppTypes.CommandsManager;
  servicesManager: AppTypes.ServicesManager;
  preferences: DentalPreferences;
};

function getStudyInstanceUID(displaySetService): string | undefined {
  const displaySet = displaySetService.getActiveDisplaySets?.()?.[0];
  const instance = displaySet?.instances?.[0] || displaySet?.instance;

  return displaySet?.StudyInstanceUID || instance?.StudyInstanceUID;
}

export function useDentalMeasurements({
  appConfig,
  commandsManager,
  servicesManager,
  preferences,
}: UseDentalMeasurementsOptions) {
  const {
    dentalMeasurementsService,
    displaySetService,
    measurementService,
    viewportGridService,
  } = servicesManager.services as AppTypes.ServicesManager['services'] & {
    dentalMeasurementsService: DentalMeasurementsService;
  };
  const pendingMeasurementRef = useRef<PendingMeasurement | null>(null);
  const studyInstanceUIDRef = useRef<string | undefined>();
  const lockedRef = useRef(false);
  const saveTimersRef = useRef(new Map<string, ReturnType<typeof window.setTimeout>>());
  const dentalConfig = (
    appConfig as AppTypes.Config & { dental?: Record<string, string> }
  )?.dental;
  const api = useMemo(
    () =>
      createDentalMeasurementsApi({
        baseUrl:
          dentalConfig?.measurementsApiUrl ||
          dentalConfig?.backendUrl ||
          'http://localhost:4007/api/dental',
        authToken:
          dentalConfig?.measurementsAuthToken ||
          dentalConfig?.backendAuthToken ||
          'dev-dental-token',
      }),
    [
      dentalConfig?.backendAuthToken,
      dentalConfig?.backendUrl,
      dentalConfig?.measurementsApiUrl,
      dentalConfig?.measurementsAuthToken,
    ]
  );

  const markApiError = useCallback(
    (error: unknown) => {
      if (error instanceof DentalMeasurementsAuthError) {
        lockedRef.current = true;
        dentalMeasurementsService.setStatus('locked');
        return;
      }

      dentalMeasurementsService.setStatus('unsaved');
    },
    [dentalMeasurementsService]
  );

  const persistMeasurement = useCallback(
    (measurement: DentalMeasurement) => {
      const studyInstanceUID = studyInstanceUIDRef.current;

      if (!studyInstanceUID || lockedRef.current) {
        return;
      }

      const existingTimer = saveTimersRef.current.get(measurement.annotationUID);
      if (existingTimer) {
        window.clearTimeout(existingTimer);
      }

      dentalMeasurementsService.setStatus('unsaved');
      const timer = window.setTimeout(() => {
        api
          .upsert(studyInstanceUID, measurement)
          .then(() => dentalMeasurementsService.setStatus('saved'))
          .catch(markApiError);
        saveTimersRef.current.delete(measurement.annotationUID);
      }, 300);
      saveTimersRef.current.set(measurement.annotationUID, timer);
    },
    [api, dentalMeasurementsService, markApiError]
  );

  const armPreset = useCallback(
    (presetId: DentalMeasurementPresetId, note = '') => {
      const preset = getDentalMeasurementPreset(presetId);

      pendingMeasurementRef.current = {
        presetId,
        toothId: preferences.selectedToothId,
        note,
      };
      commandsManager.runCommand('setToolActive', {
        toolName: preset.toolName,
      });
    },
    [commandsManager, preferences.selectedToothId]
  );

  useEffect(() => {
    const loadMeasurements = () => {
      const studyInstanceUID = getStudyInstanceUID(displaySetService);

      if (!studyInstanceUID || studyInstanceUID === studyInstanceUIDRef.current || lockedRef.current) {
        return;
      }

      studyInstanceUIDRef.current = studyInstanceUID;
      dentalMeasurementsService.setMeasurements([]);
      dentalMeasurementsService.setStatus('loading');
      api
        .load(studyInstanceUID)
        .then(measurements => {
          dentalMeasurementsService.setMeasurements([
            ...measurements,
            ...dentalMeasurementsService.getMeasurements(),
          ]);
          dentalMeasurementsService.setStatus('saved');
        })
        .catch(markApiError);
    };

    loadMeasurements();
    const subscriptions = [
      displaySetService.subscribe?.(
        displaySetService.EVENTS.DISPLAY_SETS_ADDED,
        loadMeasurements
      ),
      displaySetService.subscribe?.(
        displaySetService.EVENTS.DISPLAY_SETS_CHANGED,
        loadMeasurements
      ),
    ].filter(Boolean);

    return () => subscriptions.forEach(subscription => subscription.unsubscribe());
  }, [api, dentalMeasurementsService, displaySetService, markApiError]);

  useEffect(() => {
    const addedSubscription = measurementService.subscribe(
      measurementService.EVENTS.MEASUREMENT_ADDED,
      ({ measurement }) => {
        const pendingMeasurement = pendingMeasurementRef.current;

        if (!pendingMeasurement) {
          return;
        }

        const preset = getDentalMeasurementPreset(pendingMeasurement.presetId);
        if (measurement.toolName !== preset.toolName) {
          return;
        }

        pendingMeasurementRef.current = null;
        const { activeViewportId } = viewportGridService.getState();
        const dentalMeasurement = createDentalMeasurement({
          measurement,
          preset,
          toothId: pendingMeasurement.toothId,
          note: pendingMeasurement.note,
          viewportId: activeViewportId,
        });

        dentalMeasurementsService.upsertMeasurement(dentalMeasurement);
        persistMeasurement(dentalMeasurement);
        measurementService.update(
          measurement.uid,
          {
            ...measurement,
            label: preset.label,
            unit: preset.unit,
          },
          true
        );
      }
    );

    const updatedSubscription = measurementService.subscribe(
      measurementService.EVENTS.MEASUREMENT_UPDATED,
      ({ measurement }) => {
        const dentalMeasurement = dentalMeasurementsService
          .getMeasurements()
          .find(candidate => candidate.annotationUID === measurement.uid);

        if (!dentalMeasurement) {
          return;
        }

        const updatedMeasurement = updateDentalMeasurement(dentalMeasurement, measurement);
        dentalMeasurementsService.upsertMeasurement(updatedMeasurement);
        persistMeasurement(updatedMeasurement);
      }
    );
    const removedSubscription = measurementService.subscribe(
      measurementService.EVENTS.MEASUREMENT_REMOVED,
      ({ measurement }) => {
        const annotationUID = measurement?.uid;

        if (!annotationUID) {
          return;
        }

        dentalMeasurementsService.removeMeasurement(annotationUID);
        const studyInstanceUID = studyInstanceUIDRef.current;
        if (studyInstanceUID && !lockedRef.current) {
          api.remove(studyInstanceUID, annotationUID).catch(markApiError);
        }
      }
    );

    return () => {
      addedSubscription.unsubscribe();
      updatedSubscription.unsubscribe();
      removedSubscription.unsubscribe();
    };
  }, [
    api,
    dentalMeasurementsService,
    markApiError,
    measurementService,
    persistMeasurement,
    viewportGridService,
  ]);

  useEffect(() => {
    dentalMeasurementsService.setDeleteHandler(annotationUID => {
      if (measurementService.getMeasurement(annotationUID)) {
        commandsManager.runCommand('removeMeasurement', { uid: annotationUID });
        return;
      }

      dentalMeasurementsService.removeMeasurement(annotationUID);
      const studyInstanceUID = studyInstanceUIDRef.current;
      if (studyInstanceUID && !lockedRef.current) {
        api.remove(studyInstanceUID, annotationUID).catch(markApiError);
      }
    });

    return () => {
      dentalMeasurementsService.setDeleteHandler(null);
      saveTimersRef.current.forEach(timer => window.clearTimeout(timer));
      saveTimersRef.current.clear();
    };
  }, [api, commandsManager, dentalMeasurementsService, markApiError, measurementService]);

  return { armPreset };
}

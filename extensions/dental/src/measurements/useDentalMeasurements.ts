import { useCallback, useEffect, useRef, useState } from 'react';

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

type PendingMeasurement = {
  presetId: DentalMeasurementPresetId;
  toothId: string;
  note: string;
};

type UseDentalMeasurementsOptions = {
  commandsManager: AppTypes.CommandsManager;
  servicesManager: AppTypes.ServicesManager;
  preferences: DentalPreferences;
};

export function useDentalMeasurements({
  commandsManager,
  servicesManager,
  preferences,
}: UseDentalMeasurementsOptions) {
  const { measurementService, viewportGridService } = servicesManager.services;
  const pendingMeasurementRef = useRef<PendingMeasurement | null>(null);
  const measurementsRef = useRef(new Map<string, DentalMeasurement>());
  const [measurements, setMeasurements] = useState<DentalMeasurement[]>([]);

  const publishMeasurements = useCallback(() => {
    setMeasurements(Array.from(measurementsRef.current.values()));
  }, []);

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

        measurementsRef.current.set(measurement.uid, dentalMeasurement);
        publishMeasurements();
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
        const dentalMeasurement = measurementsRef.current.get(measurement.uid);

        if (!dentalMeasurement) {
          return;
        }

        measurementsRef.current.set(
          measurement.uid,
          updateDentalMeasurement(dentalMeasurement, measurement)
        );
        publishMeasurements();
      }
    );

    return () => {
      addedSubscription.unsubscribe();
      updatedSubscription.unsubscribe();
    };
  }, [measurementService, publishMeasurements, viewportGridService]);

  return {
    armPreset,
    measurements,
  };
}

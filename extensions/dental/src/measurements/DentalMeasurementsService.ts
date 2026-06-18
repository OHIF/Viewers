import { PubSubService } from '@ohif/core';

import { DentalMeasurement } from './dentalMeasurement';

const EVENTS = {
  MEASUREMENTS_CHANGED: 'event::dental-measurements:changed',
  STATUS_CHANGED: 'event::dental-measurements:status-changed',
};

export type DentalMeasurementsStatus = 'idle' | 'loading' | 'saved' | 'unsaved' | 'locked';

export class DentalMeasurementsService extends PubSubService {
  public static readonly REGISTRATION = {
    name: 'dentalMeasurementsService',
    altName: 'DentalMeasurementsService',
    create: () => new DentalMeasurementsService(),
  };

  private measurements = new Map<string, DentalMeasurement>();
  private status: DentalMeasurementsStatus = 'idle';
  private deleteHandler: ((annotationUID: string) => void) | null = null;

  constructor() {
    super(EVENTS);
  }

  getMeasurements(): DentalMeasurement[] {
    return Array.from(this.measurements.values());
  }

  setMeasurements(measurements: DentalMeasurement[]): void {
    this.measurements = new Map(
      measurements.map(measurement => [measurement.annotationUID, measurement])
    );
    this.broadcastMeasurements();
  }

  upsertMeasurement(measurement: DentalMeasurement): void {
    this.measurements.set(measurement.annotationUID, measurement);
    this.broadcastMeasurements();
  }

  removeMeasurement(annotationUID: string): void {
    if (this.measurements.delete(annotationUID)) {
      this.broadcastMeasurements();
    }
  }

  getStatus(): DentalMeasurementsStatus {
    return this.status;
  }

  setStatus(status: DentalMeasurementsStatus): void {
    if (status === this.status) {
      return;
    }

    this.status = status;
    this._broadcastEvent(EVENTS.STATUS_CHANGED, { status });
  }

  setDeleteHandler(handler: ((annotationUID: string) => void) | null): void {
    this.deleteHandler = handler;
  }

  requestDelete(annotationUID: string): void {
    this.deleteHandler?.(annotationUID);
  }

  private broadcastMeasurements(): void {
    this._broadcastEvent(EVENTS.MEASUREMENTS_CHANGED, {
      measurements: this.getMeasurements(),
    });
  }
}

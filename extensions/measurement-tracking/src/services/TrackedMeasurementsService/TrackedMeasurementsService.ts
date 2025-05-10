import { PubSubService } from '@ohif/core';

const EVENTS = {
  TRACKED_SERIES_CHANGED: 'event::trackedmeasurements:trackedserieschanged',
};

/**
 * Service class for accessing tracked measurements data.
 * This service provides a robust way to access tracked series information
 * from anywhere in the application, including outside of React components.
 */
export class TrackedMeasurementsService extends PubSubService {
  public static readonly REGISTRATION = {
    name: 'trackedMeasurementsService',
    altName: 'TrackedMeasurementsService',
    create: ({ configuration = {} }) => {
      return new TrackedMeasurementsService();
    },
  };

  private _trackedSeries: string[] = [];

  constructor() {
    super(EVENTS);
  }

  /**
   * Updates the tracked series and notifies subscribers
   * @param trackedSeries Array of series UIDs being tracked
   */
  public updateTrackedSeries(trackedSeries: string[]): void {
    if (!trackedSeries) {
      trackedSeries = [];
    }

    // Check if arrays are different before updating
    const hasChanged =
      this._trackedSeries.length !== trackedSeries.length ||
      this._trackedSeries.some((seriesUID, index) => seriesUID !== trackedSeries[index]);

    if (hasChanged) {
      this._trackedSeries = [...trackedSeries];

      // Notify subscribers of changes
      this._broadcastEvent(EVENTS.TRACKED_SERIES_CHANGED, {
        trackedSeries: this.getTrackedSeries(),
      });
    }
  }

  /**
   * Retrieves the currently tracked series
   * @returns Array of series UIDs being tracked
   */
  public getTrackedSeries(): string[] {
    return [...this._trackedSeries]; // Return a copy to prevent mutation
  }

  /**
   * Checks if a specific series is being tracked
   * @param seriesInstanceUID Series instance UID to check
   * @returns boolean indicating if series is tracked
   */
  public isSeriesTracked(seriesInstanceUID: string): boolean {
    return this._trackedSeries.includes(seriesInstanceUID);
  }

  /**
   * Resets the service state
   */
  public reset(): void {
    this._trackedSeries = [];
    super.reset();
  }
}

export default TrackedMeasurementsService;

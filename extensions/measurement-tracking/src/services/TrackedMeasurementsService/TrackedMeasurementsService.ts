import { PubSubService } from '@ohif/core';

const EVENTS = {
  TRACKED_SERIES_CHANGED: 'event::trackedmeasurements:trackedserieschanged',
  SERIES_ADDED: 'event::trackedmeasurements:seriesadded',
  SERIES_REMOVED: 'event::trackedmeasurements:seriesremoved',
  TRACKING_ENABLED: 'event::trackedmeasurements:trackingenabled',
  TRACKING_DISABLED: 'event::trackedmeasurements:trackingdisabled',
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

    const hasChanged =
      this._trackedSeries.length !== trackedSeries.length ||
      this._trackedSeries.some((seriesUID, index) => seriesUID !== trackedSeries[index]);

    if (hasChanged) {
      const oldSeries = [...this._trackedSeries];
      this._trackedSeries = [...trackedSeries];

      const wasEmpty = oldSeries.length === 0;
      const isEmpty = trackedSeries.length === 0;

      if (wasEmpty && !isEmpty) {
        this._broadcastEvent(EVENTS.TRACKING_ENABLED, {
          trackedSeries: this.getTrackedSeries(),
        });
      } else if (!wasEmpty && isEmpty) {
        this._broadcastEvent(EVENTS.TRACKING_DISABLED, {
          trackedSeries: this.getTrackedSeries(),
        });
      }

      this._broadcastEvent(EVENTS.TRACKED_SERIES_CHANGED, {
        trackedSeries: this.getTrackedSeries(),
      });
    }
  }

  /**
   * Adds a single series to tracking
   * @param seriesInstanceUID Series instance UID to add to tracking
   */
  public addTrackedSeries(seriesInstanceUID: string): void {
    if (!seriesInstanceUID || this.isSeriesTracked(seriesInstanceUID)) {
      return;
    }

    const wasEmpty = this._trackedSeries.length === 0;
    this._trackedSeries = [...this._trackedSeries, seriesInstanceUID];

    this._broadcastEvent(EVENTS.SERIES_ADDED, {
      seriesInstanceUID,
      trackedSeries: this.getTrackedSeries(),
    });

    if (wasEmpty) {
      this._broadcastEvent(EVENTS.TRACKING_ENABLED, {
        trackedSeries: this.getTrackedSeries(),
      });
    }

    this._broadcastEvent(EVENTS.TRACKED_SERIES_CHANGED, {
      trackedSeries: this.getTrackedSeries(),
    });
  }

  /**
   * Removes a single series from tracking
   * @param seriesInstanceUID Series instance UID to remove from tracking
   */
  public removeTrackedSeries(seriesInstanceUID: string): void {
    if (!seriesInstanceUID || !this.isSeriesTracked(seriesInstanceUID)) {
      return;
    }

    this._trackedSeries = this._trackedSeries.filter(uid => uid !== seriesInstanceUID);

    this._broadcastEvent(EVENTS.SERIES_REMOVED, {
      seriesInstanceUID,
      trackedSeries: this.getTrackedSeries(),
    });

    if (this._trackedSeries.length === 0) {
      this._broadcastEvent(EVENTS.TRACKING_DISABLED, {
        trackedSeries: this.getTrackedSeries(),
      });
    }

    this._broadcastEvent(EVENTS.TRACKED_SERIES_CHANGED, {
      trackedSeries: this.getTrackedSeries(),
    });
  }

  /**
   * Retrieves the currently tracked series
   * @returns Array of series UIDs being tracked
   */
  public getTrackedSeries(): string[] {
    return [...this._trackedSeries];
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
    const wasTracking = this._trackedSeries.length > 0;
    this._trackedSeries = [];

    if (wasTracking) {
      this._broadcastEvent(EVENTS.TRACKING_DISABLED, {
        trackedSeries: [],
      });

      this._broadcastEvent(EVENTS.TRACKED_SERIES_CHANGED, {
        trackedSeries: [],
      });
    }

    super.reset();
  }

  /**
   * Checks if any series are being tracked
   * @returns boolean indicating if tracking is active
   */
  public isTrackingEnabled(): boolean {
    return this._trackedSeries.length > 0;
  }
}

export default TrackedMeasurementsService;

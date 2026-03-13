/**
 * Tracks UIDs of annotations and measurements that originated from the cast hub,
 * so we can avoid re-publishing or treat them differently (e.g. allow updates from hub).
 */

export class CastOriginTracker {
  private _annotations: Set<string> = new Set();
  private _measurements: Set<string> = new Set();

  hasAnnotation(id: string): boolean {
    return this._annotations.has(id);
  }

  addAnnotation(id: string): void {
    this._annotations.add(id);
  }

  removeAnnotation(id: string): void {
    this._annotations.delete(id);
  }

  hasMeasurement(id: string): boolean {
    return this._measurements.has(id);
  }

  addMeasurement(id: string): void {
    this._measurements.add(id);
  }

  removeMeasurement(id: string): void {
    this._measurements.delete(id);
  }

  /** For backward compatibility with MeasurementService.setPublishOptions and handler. */
  getAnnotationsSet(): Set<string> {
    return this._annotations;
  }

  /** For backward compatibility with MeasurementService.setPublishOptions and handler. */
  getMeasurementsSet(): Set<string> {
    return this._measurements;
  }

  clear(): void {
    this._annotations.clear();
    this._measurements.clear();
  }
}

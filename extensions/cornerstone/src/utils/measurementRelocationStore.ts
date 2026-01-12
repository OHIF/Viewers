type MeasurementRelocationRequest = {
  measurementUID: string;
  frameOfReferenceUID?: string;
  toolName?: string;
  /**
   * If true, the annotation should remain hidden until the relocation click is applied.
   * After applying the relocation, it will be made visible.
   */
  makeVisibleAfterRelocation?: boolean;
};

let pendingRelocation: MeasurementRelocationRequest | null = null;

export function queueMeasurementRelocation(request: MeasurementRelocationRequest): void {
  pendingRelocation = request;
}

export function getPendingMeasurementRelocation(): MeasurementRelocationRequest | null {
  return pendingRelocation;
}

export function consumeMeasurementRelocation(): MeasurementRelocationRequest | null {
  const request = pendingRelocation;
  pendingRelocation = null;
  return request;
}

export function clearMeasurementRelocation(): void {
  pendingRelocation = null;
}

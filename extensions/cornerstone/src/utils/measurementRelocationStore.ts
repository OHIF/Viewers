type MeasurementRelocationRequest = {
  measurementUID: string;
  frameOfReferenceUID?: string;
  toolName?: string;
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

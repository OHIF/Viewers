const DEFAULT_PRACTICE_NAME = 'Dental Practice';

export function getPracticeName(appConfig): string {
  return (
    appConfig?.dental?.practiceName ||
    appConfig?.practiceName ||
    appConfig?.whiteLabeling?.practiceName ||
    DEFAULT_PRACTICE_NAME
  );
}

export function formatHeaderValue(value, fallback = 'Not available'): string {
  return value || fallback;
}

export function getStudySummary(displaySetService) {
  const displaySet = displaySetService.getActiveDisplaySets?.()?.[0];
  const instance = displaySet?.instances?.[0] || displaySet?.instance;

  return {
    studyDate: instance?.StudyDate || displaySet?.StudyDate,
    modality: instance?.Modality || displaySet?.Modality,
  };
}

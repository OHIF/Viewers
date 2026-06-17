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

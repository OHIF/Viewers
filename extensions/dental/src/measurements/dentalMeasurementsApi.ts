import { DentalMeasurement } from './dentalMeasurement';

export class DentalMeasurementsAuthError extends Error {
  status: number;

  constructor(status: number) {
    super('Dental measurements auth failed');
    this.name = 'DentalMeasurementsAuthError';
    this.status = status;
  }
}

export class DentalMeasurementsUnavailableError extends Error {
  constructor() {
    super('Dental measurements API unavailable');
    this.name = 'DentalMeasurementsUnavailableError';
  }
}

type DentalMeasurementsApiConfig = {
  baseUrl: string;
  authToken: string;
  fetcher?: typeof fetch;
};

function measurementsUrl(baseUrl: string, studyInstanceUID: string): string {
  return `${baseUrl.replace(/\/+$/, '')}/measurements/${encodeURIComponent(studyInstanceUID)}`;
}

function requestJson(url: string, options: RequestInit, fetcher: typeof fetch): Promise<unknown> {
  return fetcher(url, options)
    .catch(() => {
      throw new DentalMeasurementsUnavailableError();
    })
    .then(response => {
      if (response.status === 401 || response.status === 403) {
        throw new DentalMeasurementsAuthError(response.status);
      }

      if (!response.ok) {
        throw new DentalMeasurementsUnavailableError();
      }

      return response.json();
    });
}

export function createDentalMeasurementsApi({
  baseUrl,
  authToken,
  fetcher = fetch,
}: DentalMeasurementsApiConfig) {
  const headers = {
    authorization: `Bearer ${authToken}`,
    'content-type': 'application/json',
  };

  return {
    load(studyInstanceUID: string): Promise<DentalMeasurement[]> {
      return requestJson(
        measurementsUrl(baseUrl, studyInstanceUID),
        { method: 'GET', headers },
        fetcher
      ).then(
        payload => (payload as { measurements?: DentalMeasurement[] }).measurements || []
      );
    },

    upsert(studyInstanceUID: string, measurement: DentalMeasurement): Promise<void> {
      return requestJson(
        measurementsUrl(baseUrl, studyInstanceUID),
        {
          method: 'POST',
          headers,
          body: JSON.stringify(measurement),
        },
        fetcher
      ).then(() => undefined);
    },

    remove(studyInstanceUID: string, annotationUID: string): Promise<void> {
      return requestJson(
        `${measurementsUrl(baseUrl, studyInstanceUID)}/${encodeURIComponent(annotationUID)}`,
        { method: 'DELETE', headers },
        fetcher
      ).then(() => undefined);
    },
  };
}

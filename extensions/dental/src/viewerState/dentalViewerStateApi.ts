import { DentalViewerState } from './dentalViewerState';

export class DentalViewerStateAuthError extends Error {
  status: number;

  constructor(status: number) {
    super('Dental viewer state auth failed');
    this.name = 'DentalViewerStateAuthError';
    this.status = status;
  }
}

export class DentalViewerStateUnavailableError extends Error {
  constructor() {
    super('Dental viewer state API unavailable');
    this.name = 'DentalViewerStateUnavailableError';
  }
}

type DentalViewerStateApiConfig = {
  baseUrl: string;
  authToken: string;
  fetcher?: typeof fetch;
};

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, '');
}

function stateUrl(baseUrl: string, studyInstanceUID: string): string {
  return `${trimTrailingSlash(baseUrl)}/state/${encodeURIComponent(studyInstanceUID)}`;
}

function requestJson(
  url: string,
  options: RequestInit,
  fetcher: typeof fetch
): Promise<unknown> {
  return fetcher(url, options)
    .catch(() => {
      throw new DentalViewerStateUnavailableError();
    })
    .then(response => {
      if (response.status === 401 || response.status === 403) {
        throw new DentalViewerStateAuthError(response.status);
      }

      if (!response.ok) {
        throw new DentalViewerStateUnavailableError();
      }

      return response.json();
    });
}

export function createDentalViewerStateApi({
  baseUrl,
  authToken,
  fetcher = fetch,
}: DentalViewerStateApiConfig) {
  const headers = {
    authorization: `Bearer ${authToken}`,
    'content-type': 'application/json',
  };

  return {
    load(studyInstanceUID: string): Promise<unknown> {
      return requestJson(
        stateUrl(baseUrl, studyInstanceUID),
        {
          method: 'GET',
          headers,
        },
        fetcher
      ).then(payload => (payload as { state?: unknown })?.state || null);
    },

    save(studyInstanceUID: string, state: DentalViewerState): Promise<void> {
      return requestJson(
        stateUrl(baseUrl, studyInstanceUID),
        {
          method: 'PUT',
          headers,
          body: JSON.stringify({ state }),
        },
        fetcher
      ).then(() => undefined);
    },
  };
}

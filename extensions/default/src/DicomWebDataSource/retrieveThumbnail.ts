import { HeadersInterface } from '@ohif/core/src/types/RequestHeaders';

export type ThumbnailContext = {
  StudyInstanceUID?: string;
  SeriesInstanceUID?: string;
  SOPInstanceUID?: string;
};

type ThumbnailFetchRequestResult = {
  url: string;
  endpointPath: string;
  headers: Record<string, string>;
};

type GetThumbnailSrcOptions = {
  signal?: AbortSignal;
  getImageSrc?: (imageId: unknown) => unknown;
};

type QidoClient = {
  headers: HeadersInterface;
  searchForInstances: (opts: unknown) => Promise<unknown[]>;
};

/**
 * The subset of the data source's `retrieve` object the thumbnail strategies
 * call back into for the directURL and bulkData-backed renderings.
 */
type RetrieveApi = {
  directURL: (params: unknown) => unknown;
  bulkDataURI: (params: unknown) => Promise<BlobPart>;
};

type ThumbnailConfig = {
  thumbnailRendering?: string;
  thumbnailRequestStrategy?: 'bulkDataRetrieve' | 'fetch';
  wadoRoot?: string;
};

type GetGetThumbnailSrcDeps = {
  thumbnailContext: ThumbnailContext;
  imageId: unknown;
  config: ThumbnailConfig;
  getAuthorizationHeader: () => HeadersInterface;
  qidoDicomWebClient: QidoClient;
  retrieve: RetrieveApi;
};

/**
 * Builds the `getThumbnailSrc` function for a given thumbnail context,
 * selecting the strategy from `config.thumbnailRendering` /
 * `config.thumbnailRequestStrategy`.
 *
 * Extracted from the DICOMweb data source so the thumbnail strategies live
 * apart from the data source wiring. The `retrieve` dependency provides the
 * `directURL` and `bulkDataURI` callbacks the data source used to reach via
 * `this`.
 */
export function getGetThumbnailSrc({
  thumbnailContext,
  imageId,
  config,
  getAuthorizationHeader,
  qidoDicomWebClient,
  retrieve,
}: GetGetThumbnailSrcDeps) {
  const thumbnailRendering = config.thumbnailRendering;
  if (!thumbnailRendering) {
    return function getThumbnailSrc() {
      console.warn('thumbnailRendering is not configured; returning null thumbnail src.');
      return null;
    };
  }

  if (thumbnailRendering === 'wadors') {
    return function getThumbnailSrc(options?: GetThumbnailSrcOptions) {
      if (!imageId) {
        return null;
      }
      if (!options?.getImageSrc) {
        return null;
      }
      // Note: options.signal (Cornerstone-backed loadImageToCanvas via getImageSrc) does
      // not currently expose an AbortSignal hook, so abort is not propagated to the
      // underlying image load. We short-circuit only if already aborted at call time.
      if (options?.signal?.aborted) {
        return null;
      }
      return options.getImageSrc(imageId);
    };
  }

  // thumbnailDirect is for plain <img src> URLs without auth headers; never use fetch here.
  // No network call happens at this layer (the <img> element loads the URL later), so
  // options.signal is not applicable here.
  if (thumbnailRendering === 'thumbnailDirect') {
    return function getThumbnailSrc() {
      return retrieve.directURL({
        instance: thumbnailContext,
        defaultPath: '/thumbnail',
        defaultType: 'image/jpeg',
        singlepart: true,
        tag: 'Absent',
      });
    };
  }

  const thumbnailRequestStrategy = config.thumbnailRequestStrategy || 'bulkDataRetrieve';
  if (thumbnailRequestStrategy === 'fetch') {
    return async function getThumbnailSrc(options?: { signal?: AbortSignal }) {
      return fetchThumbnailWithQidoFallbackForSeries(
        thumbnailContext,
        thumbnailRendering,
        config.wadoRoot,
        getAuthorizationHeader,
        qidoDicomWebClient,
        options?.signal
      );
    };
  }

  if (thumbnailRendering === 'thumbnail') {
    return async function getThumbnailSrc(options?: { signal?: AbortSignal }) {
      // Note: this path goes through bulkDataURI -> dicomweb-client retrieveBulkData,
      // which is XHR-based and does NOT honor AbortSignal. The underlying request will
      // run to completion server-side even if signal aborts; we only short-circuit
      // before kicking it off if already aborted.
      if (options?.signal?.aborted) {
        return null;
      }
      const endpoint = buildThumbnailEndpointPath(
        thumbnailContext,
        thumbnailRendering,
        new URLSearchParams({ accept: 'image/jpeg' })
      );
      const bulkDataURI = `${config.wadoRoot}${endpoint}`;
      return URL.createObjectURL(
        new Blob(
          [
            await retrieve.bulkDataURI({
              BulkDataURI: bulkDataURI.replace('wadors:', ''),
              defaultType: 'image/jpeg',
              mediaTypes: ['image/jpeg'],
              thumbnail: true,
            }),
          ],
          { type: 'image/jpeg' }
        )
      );
    };
  }
  if (thumbnailRendering === 'rendered') {
    return async function getThumbnailSrc(options?: { signal?: AbortSignal }) {
      // Note: this path goes through bulkDataURI -> dicomweb-client retrieveBulkData,
      // which is XHR-based and does NOT honor AbortSignal. The underlying request will
      // run to completion server-side even if signal aborts; we only short-circuit
      // before kicking it off if already aborted.
      if (options?.signal?.aborted) {
        return null;
      }
      const endpoint = buildThumbnailEndpointPath(
        thumbnailContext,
        thumbnailRendering,
        new URLSearchParams({ accept: 'image/jpeg' })
      );
      const bulkDataURI = `${config.wadoRoot}${endpoint}`;
      return URL.createObjectURL(
        new Blob(
          [
            await retrieve.bulkDataURI({
              BulkDataURI: bulkDataURI.replace('wadors:', ''),
              defaultType: 'image/jpeg',
              mediaTypes: ['image/jpeg'],
              thumbnail: true,
            }),
          ],
          { type: 'image/jpeg' }
        )
      );
    };
  }

  return function getThumbnailSrc() {
    console.warn(
      `Unsupported thumbnailRendering "${thumbnailRendering}"; returning null thumbnail src.`
    );
    return null;
  };
}

function buildThumbnailEndpointPath(
  thumbnailContext: ThumbnailContext,
  thumbnailRendering: string,
  queryParams?: URLSearchParams
): string {
  const { StudyInstanceUID, SeriesInstanceUID, SOPInstanceUID } = thumbnailContext;

  const basePath =
    SeriesInstanceUID && SOPInstanceUID
      ? `/studies/${StudyInstanceUID}/series/${SeriesInstanceUID}/instances/${SOPInstanceUID}/${thumbnailRendering}`
      : SeriesInstanceUID
        ? `/studies/${StudyInstanceUID}/series/${SeriesInstanceUID}/${thumbnailRendering}`
        : `/studies/${StudyInstanceUID}/${thumbnailRendering}`;

  if (!queryParams) {
    return basePath;
  }

  const queryString = queryParams.toString();

  return queryString ? `${basePath}?${queryString}` : basePath;
}

function getThumbnailFetchRequest(
  thumbnailContext: ThumbnailContext,
  thumbnailRendering: string,
  wadoRoot: string | undefined,
  getAuthorizationHeader: () => HeadersInterface
): ThumbnailFetchRequestResult {
  const endpointPath = buildThumbnailEndpointPath(
    thumbnailContext,
    thumbnailRendering,
    // Thumbnails for some data source (e.g. dcm4chee) are pixelated by default, so we need to set the viewport to 256,256 to get a better thumbnail.
    new URLSearchParams({ viewport: '256,256' })
  );

  const headers: Record<string, string> = {
    ...(getAuthorizationHeader() as Record<string, string>),
    Accept: 'image/jpeg',
  };

  return {
    url: `${wadoRoot}${endpointPath}`,
    endpointPath,
    headers,
  };
}

async function fetchThumbnailObjectURL(
  thumbnailContext: ThumbnailContext,
  thumbnailRendering: string,
  wadoRoot: string | undefined,
  getAuthorizationHeader: () => HeadersInterface,
  signal?: AbortSignal
): Promise<string | null> {
  const fetchRequest = getThumbnailFetchRequest(
    thumbnailContext,
    thumbnailRendering,
    wadoRoot,
    getAuthorizationHeader
  );

  try {
    const response = await fetch(fetchRequest.url, {
      method: 'GET',
      headers: fetchRequest.headers,
      signal,
    });

    if (!response.ok) {
      console.warn(
        `thumbnail fetch failed with status ${response.status} for ${fetchRequest.endpointPath}`
      );
      return null;
    }

    const blob = await response.blob();
    return URL.createObjectURL(blob);
  } catch (error) {
    if ((error as { name?: string })?.name === 'AbortError') {
      return null;
    }
    console.warn('thumbnail fetch failed', error);
    return null;
  }
}

/**
 * When thumbnailRequestStrategy is fetch: try WADO GET for the given context; if it fails and the
 * context is series-level (no SOPInstanceUID), QIDO one instance and retry fetch once.
 */
async function fetchThumbnailWithQidoFallbackForSeries(
  thumbnailContext: ThumbnailContext,
  thumbnailRendering: string,
  wadoRoot: string | undefined,
  getAuthorizationHeader: () => HeadersInterface,
  qidoClient: QidoClient,
  signal?: AbortSignal
): Promise<string | null> {
  const sopInstanceUidTag = '00080018';

  const initialThumbnailUrl = await fetchThumbnailObjectURL(
    thumbnailContext,
    thumbnailRendering,
    wadoRoot,
    getAuthorizationHeader,
    signal
  );
  if (initialThumbnailUrl) {
    return initialThumbnailUrl;
  }
  if (signal?.aborted) {
    return null;
  }
  if (thumbnailContext.SOPInstanceUID) {
    return null;
  }
  if (!thumbnailContext.StudyInstanceUID || !thumbnailContext.SeriesInstanceUID) {
    return null;
  }
  try {
    qidoClient.headers = getAuthorizationHeader();
    // Note: qidoClient.searchForInstances is XHR-based (dicomweb-client) and does not honor
    // AbortSignal. If signal aborts mid-request the network call still completes; we just
    // short-circuit before issuing a follow-up fetch below.
    const instances = await qidoClient.searchForInstances({
      studyInstanceUID: thumbnailContext.StudyInstanceUID,
      seriesInstanceUID: thumbnailContext.SeriesInstanceUID,
      queryParams: {
        limit: 1,
        includefield: sopInstanceUidTag,
      },
    });
    if (signal?.aborted) {
      return null;
    }
    const firstInstance = instances?.[0] as Record<string, unknown> | undefined;
    const sopAttr = firstInstance?.[sopInstanceUidTag] as { Value?: string[] } | undefined;
    const sopValues = sopAttr?.Value;
    const SOPInstanceUID =
      Array.isArray(sopValues) && sopValues.length ? String(sopValues[0]) : undefined;
    if (!SOPInstanceUID) {
      return null;
    }
    return fetchThumbnailObjectURL(
      { ...thumbnailContext, SOPInstanceUID },
      thumbnailRendering,
      wadoRoot,
      getAuthorizationHeader,
      signal
    );
  } catch (error) {
    console.warn('thumbnail fetch QIDO fallback failed', error);
    return null;
  }
}

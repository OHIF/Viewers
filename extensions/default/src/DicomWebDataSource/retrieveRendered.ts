import { HeadersInterface } from '@ohif/core/src/types/RequestHeaders';

type RetrieveApi = {
  directURL: (params: unknown) => unknown;
};

type RenderedURLConfig = {
  wadoRoot?: string;
};

type UserAuthenticationService = {
  handleUnauthenticated?: () => unknown;
};

type GetRenderedURLDeps = {
  config: RenderedURLConfig;
  getAuthorizationHeader: () => HeadersInterface;
  retrieve: RetrieveApi;
  userAuthenticationService?: UserAuthenticationService;
};

type RenderedURLOptions = {
  signal?: AbortSignal;
};

type FetchRenderedURLOptions = RenderedURLOptions & {
  url?: string | null;
  wadoRoot?: string;
  headers?: HeadersInterface;
  userAuthenticationService?: UserAuthenticationService;
};

export type RenderedURLResult = {
  url: string | null;
  revoke?: () => void;
};

export function getRenderedURL({
  config,
  getAuthorizationHeader,
  retrieve,
  userAuthenticationService,
}: GetRenderedURLDeps) {
  return async function renderedURL(
    params: unknown,
    options: RenderedURLOptions = {}
  ): Promise<RenderedURLResult> {
    const resolvedUrl = (await retrieve.directURL(params)) as string | undefined | null;

    return fetchRenderedURL({
      url: resolvedUrl,
      wadoRoot: config.wadoRoot,
      headers: getAuthorizationHeader(),
      signal: options.signal,
      userAuthenticationService,
    });
  };
}

export async function fetchRenderedURL({
  url,
  wadoRoot,
  headers,
  signal,
  userAuthenticationService,
}: FetchRenderedURLOptions): Promise<RenderedURLResult> {
  if (!url || signal?.aborted) {
    return { url: null };
  }

  if (!headers?.Authorization || !isTrustedWadoURL(url, wadoRoot)) {
    return { url };
  }

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: headers as Record<string, string>,
      signal,
    });

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        userAuthenticationService?.handleUnauthenticated?.();
      }
      console.warn(`rendered media fetch failed with status ${response.status}`);
      return { url: null };
    }

    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);

    if (signal?.aborted) {
      URL.revokeObjectURL(objectUrl);
      return { url: null };
    }

    return {
      url: objectUrl,
      revoke: createRevokeOnce(objectUrl),
    };
  } catch (error) {
    if ((error as { name?: string })?.name === 'AbortError') {
      return { url: null };
    }

    console.warn('rendered media fetch failed', error);
    return { url: null };
  }
}

export function isTrustedWadoURL(url: string, wadoRoot?: string): boolean {
  if (!wadoRoot) {
    return false;
  }

  try {
    const parsedUrl = new URL(url, window.location.href);
    const parsedWadoRoot = new URL(wadoRoot, window.location.href);
    const isHttpUrl = parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:';
    const isHttpWadoRoot =
      parsedWadoRoot.protocol === 'http:' || parsedWadoRoot.protocol === 'https:';

    return isHttpUrl && isHttpWadoRoot && parsedUrl.origin === parsedWadoRoot.origin;
  } catch {
    return false;
  }
}

function createRevokeOnce(objectUrl: string) {
  let revoked = false;

  return () => {
    if (revoked) {
      return;
    }

    URL.revokeObjectURL(objectUrl);
    revoked = true;
  };
}

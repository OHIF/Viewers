import { fetchRenderedURL, getRenderedURL, isTrustedWadoURL } from './retrieveRendered';

describe('retrieveRendered', () => {
  const originalFetch = global.fetch;
  const originalCreateObjectURL = URL.createObjectURL;
  const originalRevokeObjectURL = URL.revokeObjectURL;

  beforeEach(() => {
    global.fetch = jest.fn();
    URL.createObjectURL = jest.fn(() => 'blob:rendered') as jest.Mock;
    URL.revokeObjectURL = jest.fn() as jest.Mock;
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
    global.fetch = originalFetch;
    URL.createObjectURL = originalCreateObjectURL;
    URL.revokeObjectURL = originalRevokeObjectURL;
  });

  it('returns null when there is no resolved URL', async () => {
    const result = await fetchRenderedURL({
      url: undefined,
      wadoRoot: 'https://example.com/dicomweb',
      headers: { Authorization: 'Bearer token' },
    });

    expect(result).toEqual({ url: null });
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('returns the direct URL without fetching when there is no authorization header', async () => {
    const result = await fetchRenderedURL({
      url: 'https://example.com/dicomweb/rendered',
      wadoRoot: 'https://example.com/dicomweb',
      headers: {},
    });

    expect(result).toEqual({ url: 'https://example.com/dicomweb/rendered' });
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('does not attach auth headers to untrusted absolute URLs', async () => {
    const result = await fetchRenderedURL({
      url: 'https://untrusted.example.com/rendered',
      wadoRoot: 'https://example.com/dicomweb',
      headers: { Authorization: 'Bearer token' },
    });

    expect(result).toEqual({ url: 'https://untrusted.example.com/rendered' });
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('fetches trusted URLs with auth and returns a revocable object URL', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      blob: jest.fn().mockResolvedValueOnce(new Blob(['pdf'], { type: 'application/pdf' })),
    });

    const result = await fetchRenderedURL({
      url: 'https://example.com/dicomweb/studies/1/rendered',
      wadoRoot: 'https://example.com/dicomweb',
      headers: { Authorization: 'Bearer token' },
    });

    expect(global.fetch).toHaveBeenCalledWith(
      'https://example.com/dicomweb/studies/1/rendered',
      expect.objectContaining({
        method: 'GET',
        headers: { Authorization: 'Bearer token' },
      })
    );
    expect(result.url).toBe('blob:rendered');

    result.revoke?.();
    result.revoke?.();

    expect(URL.revokeObjectURL).toHaveBeenCalledTimes(1);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:rendered');
  });

  it('returns null and triggers unauthenticated handling on 401/403 responses', async () => {
    const handleUnauthenticated = jest.fn();
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 401,
    });

    const result = await fetchRenderedURL({
      url: 'https://example.com/dicomweb/studies/1/rendered',
      wadoRoot: 'https://example.com/dicomweb',
      headers: { Authorization: 'Bearer token' },
      userAuthenticationService: { handleUnauthenticated },
    });

    expect(result).toEqual({ url: null });
    expect(handleUnauthenticated).toHaveBeenCalledTimes(1);
  });

  it('revokes an object URL created after the request was aborted', async () => {
    const abortController = new AbortController();
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      blob: jest.fn().mockImplementationOnce(async () => {
        abortController.abort();
        return new Blob(['pdf'], { type: 'application/pdf' });
      }),
    });

    const result = await fetchRenderedURL({
      url: 'https://example.com/dicomweb/studies/1/rendered',
      wadoRoot: 'https://example.com/dicomweb',
      headers: { Authorization: 'Bearer token' },
      signal: abortController.signal,
    });

    expect(result).toEqual({ url: null });
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:rendered');
  });

  it('resolves directURL through the datasource retrieve API', async () => {
    const renderedURL = getRenderedURL({
      config: { wadoRoot: 'https://example.com/dicomweb' },
      getAuthorizationHeader: () => ({}),
      retrieve: {
        directURL: jest.fn().mockResolvedValueOnce('https://example.com/dicomweb/rendered'),
      },
    });

    await expect(renderedURL({ instance: {} })).resolves.toEqual({
      url: 'https://example.com/dicomweb/rendered',
    });
  });

  it('trusts URLs that share the configured WADO origin', () => {
    expect(
      isTrustedWadoURL('/dicomweb/studies/1/rendered', `${window.location.origin}/dicomweb`)
    ).toBe(true);
    expect(
      isTrustedWadoURL(
        'https://other.example.com/dicomweb/studies/1/rendered',
        'https://example.com/dicomweb'
      )
    ).toBe(false);
  });
});

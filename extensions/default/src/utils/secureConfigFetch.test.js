// @ts-nocheck
import { resolveConfigFetchPolicy, fetchConfigJson } from './secureConfigFetch';

describe('secureConfigFetch', () => {
  describe('resolveConfigFetchPolicy', () => {
    it('allows arbitrary origin in unauthenticated environments', () => {
      const result = resolveConfigFetchPolicy('https://untrusted.example.com/config.json', {
        userAuthenticationService: {
          getAuthorizationHeader: () => ({}),
        },
      });

      expect(result.normalizedUrl).toBe('https://untrusted.example.com/config.json');
      expect(result.isAuthenticated).toBe(false);
    });

    it('blocks non-allowlisted origins in authenticated environments', () => {
      expect(() =>
        resolveConfigFetchPolicy('https://untrusted.example.com/config.json', {
          allowedOrigins: ['https://trusted.example.com'],
          userAuthenticationService: {
            getAuthorizationHeader: () => ({ Authorization: 'Bearer token123' }),
          },
        })
      ).toThrow('Blocked remote configuration origin');
    });

    it('allows allowlisted origin in authenticated environments', () => {
      const result = resolveConfigFetchPolicy('http://localhost:5000/config.json', {
        allowedOrigins: ['http://localhost:5000', 'https://trusted.example.com'],
        userAuthenticationService: {
          getAuthorizationHeader: () => ({ Authorization: 'Bearer token123' }),
        },
      });

      expect(result.normalizedUrl).toBe('http://localhost:5000/config.json');
      expect(result.isAuthenticated).toBe(true);
    });

    it('blocks authenticated fetch when allowlist is missing', () => {
      expect(() =>
        resolveConfigFetchPolicy('https://noTrustList.example.com/config.json', {
          userAuthenticationService: {
            getAuthorizationHeader: () => ({ Authorization: 'Bearer token123' }),
          },
        })
      ).toThrow('Blocked remote configuration origin');
    });

    it('allows same-origin in authenticated environments without allowlist', () => {
      const result = resolveConfigFetchPolicy('/protected/config.json', {
        userAuthenticationService: {
          getAuthorizationHeader: () => ({ Authorization: 'Bearer token123' }),
        },
      });

      expect(result.normalizedUrl).toBe(`${window.location.origin}/protected/config.json`);
      expect(result.isAuthenticated).toBe(true);
    });

    it('rejects embedded userinfo in config URLs', () => {
      expect(() =>
        resolveConfigFetchPolicy('https://user:pass@trusted.example.com/config.json', {
          allowedOrigins: ['https://trusted.example.com'],
          userAuthenticationService: {
            getAuthorizationHeader: () => ({ Authorization: 'Bearer token123' }),
          },
        })
      ).toThrow('URL userinfo is not allowed for dynamic datasource configuration');
    });
  });

  describe('fetchConfigJson', () => {
    const originalFetch = global.fetch;

    beforeEach(() => {
      global.fetch = jest.fn();
    });

    afterEach(() => {
      jest.restoreAllMocks();
      global.fetch = originalFetch;
    });

    it('uses hardened fetch options for unauthenticated cross-origin requests', async () => {
      global.fetch.mockResolvedValue({
        status: 200,
        ok: true,
        json: async () => ({ ok: true }),
      });

      await fetchConfigJson({
        normalizedUrl: 'https://example.com/config.json',
        isAuthenticated: false,
      });

      expect(global.fetch).toHaveBeenCalledWith(
        'https://example.com/config.json',
        expect.objectContaining({
          method: 'GET',
          mode: 'cors',
          credentials: 'omit',
          redirect: 'error',
          referrerPolicy: 'no-referrer',
        })
      );
    });

    it('uses simple fetch for unauthenticated same-origin requests', async () => {
      global.fetch.mockResolvedValue({
        status: 200,
        ok: true,
        json: async () => ({ ok: true }),
      });

      await fetchConfigJson({
        normalizedUrl: `${window.location.origin}/protected/config.json`,
        isAuthenticated: false,
      });

      expect(global.fetch).toHaveBeenCalledWith(
        `${window.location.origin}/protected/config.json`
      );
    });

    it('uses simple fetch in authenticated environments', async () => {
      global.fetch.mockResolvedValue({
        status: 200,
        ok: true,
        json: async () => ({ ok: true }),
      });

      await fetchConfigJson({
        normalizedUrl: 'https://trusted.example.com/config.json',
        isAuthenticated: true,
      });

      expect(global.fetch).toHaveBeenCalledWith('https://trusted.example.com/config.json');
    });
  });
});

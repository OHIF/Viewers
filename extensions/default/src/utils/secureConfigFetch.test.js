// @ts-nocheck
import {
  resolveDicomWebProxyConfigPolicy,
  resolveDicomJsonConfigFetchPolicy,
  fetchConfigJson,
  applyConfigUrlTrustToEndpoints,
} from './secureConfigFetch';

describe('secureConfigFetch', () => {
  describe('resolveDicomWebProxyConfigPolicy', () => {
    beforeEach(() => {
      jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('allows untrusted remote http URLs and forces omit credentials', () => {
      const result = resolveDicomWebProxyConfigPolicy('http://example.com/config.json');
      expect(result.normalizedUrl).toBe('http://example.com/config.json');
      expect(result.credentialsMode).toBe('omit');
      expect(result.isTrusted).toBe(false);
    });

    it('uses include credentials for trusted origins', () => {
      const result = resolveDicomWebProxyConfigPolicy('https://trusted.example.com/config.json', {
        trustedOrigins: ['https://trusted.example.com'],
      });

      expect(result.credentialsMode).toBe('include');
      expect(result.isTrusted).toBe(true);
    });

    it('honors configFetchAuthMode for trusted origins', () => {
      const result = resolveDicomWebProxyConfigPolicy('https://trusted.example.com/config.json', {
        trustedOrigins: ['https://trusted.example.com'],
        configFetchAuthMode: 'omit',
      });

      expect(result.credentialsMode).toBe('omit');
      expect(result.isTrusted).toBe(true);
    });

    it('allows localhost http credentials when explicitly enabled', () => {
      const result = resolveDicomWebProxyConfigPolicy('http://localhost:5000/config.json', {
        trustLocalhostHttp: true,
      });

      expect(result.normalizedUrl).toBe('http://localhost:5000/config.json');
      expect(result.credentialsMode).toBe('include');
      expect(result.isTrusted).toBe(true);
    });

    it('preserves embedded url auth for trusted origins', () => {
      const result = resolveDicomWebProxyConfigPolicy(
        'https://user:pass@trusted.example.com/config.json',
        {
        trustedOrigins: ['https://trusted.example.com'],
        }
      );

      expect(result.normalizedUrl).toBe('https://user:pass@trusted.example.com/config.json');
    });

    it('strips embedded url auth for untrusted origins', () => {
      const result = resolveDicomWebProxyConfigPolicy(
        'https://user:pass@untrusted.example.com/config.json'
      );

      expect(result.normalizedUrl).toBe('https://untrusted.example.com/config.json');
      expect(result.credentialsMode).toBe('omit');
    });

    it('filters invalid trusted origin entries and logs errors', () => {
      const result = resolveDicomWebProxyConfigPolicy('https://trusted.example.com/config.json', {
        trustedOrigins: ['http://bad.example.com', 'https://trusted.example.com'],
      });

      expect(result.isTrusted).toBe(true);
      expect(console.error).toHaveBeenCalledWith(
        'trustedOrigins entries must be https URLs: "http://bad.example.com"'
      );
    });

    it('throws when trusted origins are configured but none are valid', () => {
      expect(() =>
        resolveDicomWebProxyConfigPolicy('https://trusted.example.com/config.json', {
          trustedOrigins: ['http://bad.example.com'],
        })
      ).toThrow('No valid trustedOrigins configured');
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

    it('uses omit credentials for untrusted config urls', async () => {
      global.fetch.mockResolvedValue({
        status: 200,
        ok: true,
        json: async () => ({ ok: true }),
      });

      await fetchConfigJson({
        normalizedUrl: 'https://untrusted.example.com/config.json',
        credentialsMode: 'omit',
      });

      expect(global.fetch).toHaveBeenCalledWith(
        'https://untrusted.example.com/config.json',
        expect.objectContaining({ credentials: 'omit' })
      );
    });

    it('uses include credentials for trusted config urls', async () => {
      global.fetch.mockResolvedValue({
        status: 200,
        ok: true,
        json: async () => ({ ok: true }),
      });

      await fetchConfigJson({
        normalizedUrl: 'https://trusted.example.com/config.json',
        credentialsMode: 'include',
      });

      expect(global.fetch).toHaveBeenCalledWith(
        'https://trusted.example.com/config.json',
        expect.objectContaining({ credentials: 'include' })
      );
    });
  });

  describe('resolveDicomJsonConfigFetchPolicy', () => {
    beforeEach(() => {
      jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('blocks non-local untrusted remote origins', () => {
      expect(() =>
        resolveDicomJsonConfigFetchPolicy('https://untrusted.example.com/config.json', {
          trustedOrigins: ['https://trusted.example.com'],
        })
      ).toThrow('Blocked untrusted dicomjson config URL origin');
    });

    it('allows trusted https origins', () => {
      const result = resolveDicomJsonConfigFetchPolicy('https://trusted.example.com/config.json', {
        trustedOrigins: ['https://trusted.example.com'],
      });
      expect(result.isTrusted).toBe(true);
      expect(result.normalizedUrl).toBe('https://trusted.example.com/config.json');
      expect(result.credentialsMode).toBe('include');
    });

    it('allows localhost http only when trustLocalhostHttp=true', () => {
      const result = resolveDicomJsonConfigFetchPolicy('http://localhost:8000/config.json', {
        trustLocalhostHttp: true,
      });
      expect(result.isTrusted).toBe(true);
      expect(result.normalizedUrl).toBe('http://localhost:8000/config.json');
    });

    it('blocks localhost http when trustLocalhostHttp=false', () => {
      expect(() =>
        resolveDicomJsonConfigFetchPolicy('http://localhost:8000/config.json', {
          trustLocalhostHttp: false,
        })
      ).toThrow('Blocked untrusted dicomjson config URL origin');
    });
  });

  describe('applyConfigUrlTrustToEndpoints', () => {
    it('preserves embedded credentials for returned endpoints from trusted config urls', () => {
      const config = applyConfigUrlTrustToEndpoints(
        {
          qidoRoot: 'https://user:pass@example.com/qido',
        },
        true
      );

      expect(config.qidoRoot).toBe('https://user:pass@example.com/qido');
    });

    it('strips embedded credentials for returned endpoints from untrusted config urls', () => {
      const config = applyConfigUrlTrustToEndpoints(
        {
          qidoRoot: 'https://user:pass@example.com/qido',
          wadoRoot: '/relative/path',
        },
        false
      );

      expect(config.qidoRoot).toBe('https://example.com/qido');
      expect(config.wadoRoot).toBe('/relative/path');
    });
  });

});

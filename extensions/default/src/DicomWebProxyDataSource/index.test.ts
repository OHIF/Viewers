import { createTrustAwareServicesManager } from './createTrustAwareServicesManager';

describe('createTrustAwareServicesManager', () => {
  it('preserves auth headers for trusted config urls', () => {
    const getAuthorizationHeader = jest.fn(() => ({ Authorization: 'Bearer token123' }));
    const servicesManager: any = {
      services: {
        userAuthenticationService: {
          getAuthorizationHeader,
        },
      },
    };

    const wrapped = createTrustAwareServicesManager(servicesManager, true);
    expect(wrapped.services.userAuthenticationService.getAuthorizationHeader()).toEqual({
      Authorization: 'Bearer token123',
    });
  });

  it('suppresses auth headers for untrusted config urls', () => {
    const getAuthorizationHeader = jest.fn(() => ({ Authorization: 'Bearer token123' }));
    const servicesManager: any = {
      services: {
        userAuthenticationService: {
          getAuthorizationHeader,
        },
      },
    };

    const wrapped = createTrustAwareServicesManager(servicesManager, false);
    expect(wrapped.services.userAuthenticationService.getAuthorizationHeader()).toEqual({});
  });
});

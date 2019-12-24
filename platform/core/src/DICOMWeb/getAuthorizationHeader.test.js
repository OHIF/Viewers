import getAuthorizationHeader from './getAuthorizationHeader';
import user from './../user';

jest.mock('./../user.js');

describe('getAuthorizationHeader', () => {
  it('should return a HTTP Basic Auth when server contains requestOptions.auth', () => {
    const validServer = {
      requestOptions: {
        auth: 'dummy_user:dummy_password',
      },
    };

    const expectedAuthorizationHeader = {
      Authorization: `Basic ${btoa(validServer.requestOptions.auth)}`,
    };

    const authentication = getAuthorizationHeader(validServer);

    expect(authentication).toEqual(expectedAuthorizationHeader);
  });

  it('should return a HTTP Basic Auth when server contains requestOptions.auth even though there is no password', () => {
    const validServerWithoutPassword = {
      requestOptions: {
        auth: 'dummy_user',
      },
    };

    const expectedAuthorizationHeader = {
      Authorization: `Basic ${btoa(
        validServerWithoutPassword.requestOptions.auth
      )}`,
    };

    const authentication = getAuthorizationHeader(validServerWithoutPassword);

    expect(authentication).toEqual(expectedAuthorizationHeader);
  });

  it('should return a HTTP Basic Auth when server contains requestOptions.auth custom function', () => {
    const validServerCustomAuth = {
      requestOptions: {
        auth: options => `Basic ${options.token}`,
        token: 'ZHVtbXlfdXNlcjpkdW1teV9wYXNzd29yZA==',
      },
    };

    const expectedAuthorizationHeader = {
      Authorization: `Basic ${validServerCustomAuth.requestOptions.token}`,
    };

    const authentication = getAuthorizationHeader(validServerCustomAuth);

    expect(authentication).toEqual(expectedAuthorizationHeader);
  });

  it('should return an empty object when there is no either server.requestOptions.auth or accessToken', () => {
    const authentication = getAuthorizationHeader({});

    expect(authentication).toEqual({});
  });

  it('should return an Authorization with accessToken when server is not defined and there is an accessToken', () => {
    user.getAccessToken.mockImplementationOnce(() => 'MOCKED_TOKEN');

    const authentication = getAuthorizationHeader({});
    const exptecteHeaderBasedOnUserAccessToekn = {
      Authorization: 'Bearer MOCKED_TOKEN',
    };

    expect(authentication).toEqual(exptecteHeaderBasedOnUserAccessToekn);
  });
});

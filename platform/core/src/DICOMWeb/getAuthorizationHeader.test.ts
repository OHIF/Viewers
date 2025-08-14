import getAuthorizationHeader from './getAuthorizationHeader';
import user from './../user';
import { HeadersInterface, RequestOptions } from '../types/RequestHeaders';

jest.mock('../user');

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

    const authentication: HeadersInterface = getAuthorizationHeader(validServer);

    expect(authentication).toEqual(expectedAuthorizationHeader);
  });

  it('should return a HTTP Basic Auth when server contains requestOptions.auth even though there is no password', () => {
    const validServerWithoutPassword = {
      requestOptions: {
        auth: 'dummy_user',
      },
    };

    const expectedAuthorizationHeader = {
      Authorization: `Basic ${btoa(validServerWithoutPassword.requestOptions.auth)}`,
    };

    const authentication: HeadersInterface = getAuthorizationHeader(validServerWithoutPassword);

    expect(authentication).toEqual(expectedAuthorizationHeader);
  });

  it('should return a HTTP Basic Auth when server contains requestOptions.auth custom function', () => {
    const validServerCustomAuth: RequestOptions = {
      requestOptions: {
        auth: options => `Basic ${options.token}`,
        token: 'ZHVtbXlfdXNlcjpkdW1teV9wYXNzd29yZA==',
      },
    };

    const expectedAuthorizationHeader = {
      Authorization: `Basic ${validServerCustomAuth.requestOptions.token}`,
    };

    const authentication: HeadersInterface = getAuthorizationHeader(validServerCustomAuth);

    expect(authentication).toEqual(expectedAuthorizationHeader);
  });

  it('should return an empty object when there is no either server.requestOptions.auth or accessToken', () => {
    const authentication: HeadersInterface = getAuthorizationHeader({});

    expect(authentication).toEqual({});
  });

  it('should return an Authorization with accessToken when server is not defined and there is an accessToken', () => {
    user.getAccessToken.mockImplementationOnce(() => 'MOCKED_TOKEN');

    const authentication: HeadersInterface = getAuthorizationHeader({}, user);
    const expectedHeaderBasedOnUserAccessToken = {
      Authorization: 'Bearer MOCKED_TOKEN',
    };

    expect(authentication).toEqual(expectedHeaderBasedOnUserAccessToken);
  });
});

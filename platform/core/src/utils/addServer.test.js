import addServers from './addServers';

describe('addServers', () => {
  const servers = {
    dicomWeb: [
      {
        name: 'DCM4CHEE',
        wadoUriRoot: 'https://server.dcmjs.org/dcm4chee-arc/aets/DCM4CHEE/wado',
        qidoRoot: 'https://server.dcmjs.org/dcm4chee-arc/aets/DCM4CHEE/rs',
        wadoRoot: 'https://server.dcmjs.org/dcm4chee-arc/aets/DCM4CHEE/rs',
        qidoSupportsIncludeField: true,
        imageRendering: 'wadors',
        thumbnailRendering: 'wadors',
      },
    ],
    oidc: [
      {
        authority: 'http://127.0.0.1/auth/realms/ohif',
        client_id: 'ohif-viewer',
        redirect_uri: 'http://127.0.0.1/callback',
        response_type: 'code',
        scope: 'openid',
        post_logout_redirect_uri: '/logout-redirect.html',
      },
    ],
  };

  const store = {
    dispatch: jest.fn(),
  };

  test('should be able to add a server and dispatch to the store successfuly', () => {
    addServers(servers, store);
    expect(store.dispatch).toBeCalledWith({
      server: {
        authority: 'http://127.0.0.1/auth/realms/ohif',
        client_id: 'ohif-viewer',
        post_logout_redirect_uri: '/logout-redirect.html',
        redirect_uri: 'http://127.0.0.1/callback',
        response_type: 'code',
        scope: 'openid',
        type: 'oidc',
      },
      type: 'ADD_SERVER',
    });
    expect(store.dispatch).toBeCalledWith({
      server: {
        imageRendering: 'wadors',
        name: 'DCM4CHEE',
        qidoRoot: 'https://server.dcmjs.org/dcm4chee-arc/aets/DCM4CHEE/rs',
        qidoSupportsIncludeField: true,
        thumbnailRendering: 'wadors',
        type: 'dicomWeb',
        wadoRoot: 'https://server.dcmjs.org/dcm4chee-arc/aets/DCM4CHEE/rs',
        wadoUriRoot: 'https://server.dcmjs.org/dcm4chee-arc/aets/DCM4CHEE/wado',
      },
      type: 'ADD_SERVER',
    });
  });

  test('should throw an error if servers list is not defined', () => {
    expect(() => addServers(undefined, store)).toThrowError(
      new Error('The servers and store must be defined')
    );
  });

  test('should throw an error if store is not defined', () => {
    expect(() => addServers(servers, undefined)).toThrowError(
      new Error('The servers and store must be defined')
    );
  });

  test('should throw an error when both server and store are not defined', () => {
    expect(() => addServers(undefined, undefined)).toThrowError(
      new Error('The servers and store must be defined')
    );
  });
});

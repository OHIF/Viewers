import { applyServiceUrls } from './applyServiceUrls';

describe('applyServiceUrls', () => {
  it('should fix cross-service URLs when roots differ', () => {
    const qidoClient = { wadoURL: 'https://server.com/qidors/org1', stowURL: 'https://server.com/qidors/org1' };
    const wadoClient = { qidoURL: 'https://server.com/wadors/org1', stowURL: 'https://server.com/wadors/org1' };

    applyServiceUrls(qidoClient, wadoClient, {
      qidoRoot: 'https://server.com/qidors/org1',
      wadoRoot: 'https://server.com/wadors/org1',
    });

    expect(qidoClient.wadoURL).toBe('https://server.com/wadors/org1');
    expect(qidoClient.stowURL).toBe('https://server.com/wadors/org1');

    expect(wadoClient.qidoURL).toBe('https://server.com/qidors/org1');
    expect(wadoClient.stowURL).toBe('https://server.com/wadors/org1');
  });

  it('should use explicit stowRoot when provided', () => {
    const qidoClient = { wadoURL: '', stowURL: '' };
    const wadoClient = { qidoURL: '', stowURL: '' };

    applyServiceUrls(qidoClient, wadoClient, {
      qidoRoot: 'https://server.com/qidors/org1',
      wadoRoot: 'https://server.com/wadors/org1',
      stowRoot: 'https://server.com/stowrs/org1',
    });

    expect(qidoClient.stowURL).toBe('https://server.com/stowrs/org1');
    expect(wadoClient.stowURL).toBe('https://server.com/stowrs/org1');
  });

  it('should be a no-op when qidoRoot and wadoRoot are the same', () => {
    const qidoClient = { wadoURL: 'https://server.com/dicomweb', stowURL: 'https://server.com/dicomweb' };
    const wadoClient = { qidoURL: 'https://server.com/dicomweb', stowURL: 'https://server.com/dicomweb' };

    applyServiceUrls(qidoClient, wadoClient, {
      qidoRoot: 'https://server.com/dicomweb',
      wadoRoot: 'https://server.com/dicomweb',
    });

    expect(qidoClient.wadoURL).toBe('https://server.com/dicomweb');
    expect(qidoClient.stowURL).toBe('https://server.com/dicomweb');
    expect(wadoClient.qidoURL).toBe('https://server.com/dicomweb');
    expect(wadoClient.stowURL).toBe('https://server.com/dicomweb');
  });

  it('should default stowURL to wadoRoot when stowRoot is not provided', () => {
    const qidoClient = { wadoURL: '', stowURL: '' };
    const wadoClient = { qidoURL: '', stowURL: '' };

    applyServiceUrls(qidoClient, wadoClient, {
      qidoRoot: 'https://server.com/qidors',
      wadoRoot: 'https://server.com/wadors',
    });

    expect(qidoClient.stowURL).toBe('https://server.com/wadors');
    expect(wadoClient.stowURL).toBe('https://server.com/wadors');
  });
});

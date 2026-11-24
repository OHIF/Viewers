import { createDicomWebProxyApi } from './index';
import { fetchConfigJson } from '../utils/secureConfigFetch';

jest.mock('@cornerstonejs/dicom-image-loader', () => ({
  __esModule: true,
  default: { prefetchPart10Instance: jest.fn() },
}));

jest.mock('../utils/secureConfigFetch', () => ({
  resolveConfigFetchPolicy: (url: string) => url,
  fetchConfigJson: jest.fn(),
}));

describe('DicomWebProxyDataSource retrieve', () => {
  it('forwards the retrieve methods that loaders call to the delegate', async () => {
    (fetchConfigJson as jest.Mock).mockResolvedValue({
      servers: {
        dicomWeb: [{ name: 'fetched', qidoRoot: '/dicomweb', wadoRoot: '/dicomweb' }],
      },
    });
    const proxy = createDicomWebProxyApi({ name: 'dicomwebproxy' }, {
      services: { userAuthenticationService: { getAuthorizationHeader: () => ({}) } },
    } as never);
    await proxy.initialize({ params: {}, query: new URLSearchParams({ url: '/config' }) });

    const prefetch = proxy.retrieve.prefetchInstanceFrames({ instance: undefined, imageId: '' });

    // The delegate answers a request it cannot serve with its no-op result.
    await expect(prefetch.done).resolves.toBe(false);
    // RT and SR loaders call bulkDataURI; the microscopy handler needs the client.
    expect(proxy.retrieve.bulkDataURI).toEqual(expect.any(Function));
    expect(proxy.retrieve.getWadoDicomWebClient()).toBeDefined();
  });
});

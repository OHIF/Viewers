import retrieveBulkData from './retrieveBulkData';

describe('retrieveBulkData', () => {
  it('returns and caches a single-part ArrayBuffer response', async () => {
    const buffer = new Uint8Array([1]).buffer;
    const client = {
      retrieveBulkData: jest.fn().mockResolvedValue(buffer),
    };
    const value: { BulkDataURI: string; Value?: ArrayBuffer } = {
      BulkDataURI: 'https://example.com/bulk/70531000',
    };

    await expect(retrieveBulkData.call(client, value)).resolves.toBe(buffer);
    expect(value.Value).toBe(buffer);
    expect(client.retrieveBulkData).toHaveBeenCalledWith(
      expect.objectContaining({
        multipart: false,
        BulkDataURI: value.BulkDataURI,
      })
    );
  });

  it('still selects the non-empty buffer from a multipart response', async () => {
    const buffer = new Uint8Array([2]).buffer;
    const client = {
      retrieveBulkData: jest.fn().mockResolvedValue([new ArrayBuffer(0), buffer]),
    };
    const value: { BulkDataURI: string; Value?: ArrayBuffer } = {
      BulkDataURI: 'https://example.com/bulk/70531009',
    };

    await expect(retrieveBulkData.call(client, value)).resolves.toBe(buffer);
    expect(value.Value).toBe(buffer);
  });
});

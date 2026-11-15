import prepareConcatenations from './prepareConcatenations';

// Synthetic two-row, three-column slide. Parts deliberately end within rows.
const createParts = () =>
  [
    { SOPInstanceUID: '1.2.3.11', ConcatenationFrameOffsetNumber: 0, NumberOfFrames: '3' },
    { SOPInstanceUID: '1.2.3.12', ConcatenationFrameOffsetNumber: 3, NumberOfFrames: '2' },
    { SOPInstanceUID: '1.2.3.13', ConcatenationFrameOffsetNumber: 5, NumberOfFrames: '1' },
  ].map((part, index) => ({
    StudyInstanceUID: '1.2.1',
    SeriesInstanceUID: '1.2.2',
    SOPInstanceUIDOfConcatenationSource: '1.2.3.10',
    ConcatenationUID: '1.2.4',
    InConcatenationNumber: index + 1,
    InConcatenationTotalNumber: 3,
    DimensionOrganizationType: 'TILED_FULL',
    ImageType: ['ORIGINAL', 'PRIMARY', 'VOLUME', 'NONE'],
    Rows: 256,
    Columns: 256,
    TotalPixelMatrixRows: 512,
    TotalPixelMatrixColumns: 768,
    OpticalPathSequence: [{ OpticalPathIdentifier: '1' }],
    ...part,
  }));

const request = (frameNumbers: (number | string)[] | string, sopInstanceUID = '1.2.3.10') => ({
  studyInstanceUID: '1.2.1',
  seriesInstanceUID: '1.2.2',
  sopInstanceUID,
  frameNumbers,
});

describe('prepareConcatenations', () => {
  it('coalesces unordered parts without changing their original metadata or client', () => {
    const parts = createParts().reverse();
    const original = JSON.parse(JSON.stringify(parts));
    const retrieve = jest.fn();
    const client = { retrieveInstanceFrames: retrieve };

    const { images, retrieveInstanceFrames } = prepareConcatenations(parts, client);

    expect(images).toHaveLength(1);
    expect(images[0]).toMatchObject({
      SOPInstanceUID: '1.2.3.10',
      NumberOfFrames: 6,
      TotalPixelMatrixRows: 512,
      TotalPixelMatrixColumns: 768,
      DimensionOrganizationType: 'TILED_FULL',
    });
    expect(images[0]).not.toHaveProperty('ConcatenationUID');
    expect(images[0]).not.toHaveProperty('ConcatenationFrameOffsetNumber');
    expect(images[0]).not.toHaveProperty('InConcatenationNumber');
    expect(parts).toEqual(original);
    expect(client.retrieveInstanceFrames).toBe(retrieve);
    expect(retrieveInstanceFrames).not.toBe(retrieve);
  });

  it('routes boundary frames to their owning instances using one-based local numbers', async () => {
    const retrieve = jest.fn().mockResolvedValue([new ArrayBuffer(1)]);
    const client = { retrieveInstanceFrames: retrieve };
    const { retrieveInstanceFrames } = prepareConcatenations(createParts(), client);

    for (const frame of [1, 3, 4, 5, 6]) {
      await retrieveInstanceFrames(request([String(frame)]));
    }

    expect(
      retrieve.mock.calls.map(([options]) => [options.sopInstanceUID, options.frameNumbers])
    ).toEqual([
      ['1.2.3.11', [1]],
      ['1.2.3.11', [3]],
      ['1.2.3.12', [1]],
      ['1.2.3.12', [2]],
      ['1.2.3.13', [1]],
    ]);
  });

  it('batches requests by part while preserving response order, client binding and options', async () => {
    const parts = createParts();
    const retrieve = jest.fn(function (options) {
      expect(this).toBe(client);
      const part = parts.find(part => part.SOPInstanceUID === options.sopInstanceUID);
      return Promise.resolve(
        options.frameNumbers.map(
          frame => Uint8Array.of(part.ConcatenationFrameOffsetNumber + frame).buffer
        )
      );
    });
    const client = { retrieveInstanceFrames: retrieve };
    const { retrieveInstanceFrames } = prepareConcatenations(parts, client);
    const options = {
      ...request('6,1,4,3,6'),
      mediaTypes: [{ mediaType: 'application/octet-stream' }],
    };

    const frames = await retrieveInstanceFrames(options);

    expect(frames.map(frame => new Uint8Array(frame)[0])).toEqual([6, 1, 4, 3, 6]);
    expect(retrieve).toHaveBeenCalledTimes(3);
    expect(
      retrieve.mock.calls.every(([partOptions]) => partOptions.mediaTypes === options.mediaTypes)
    ).toBe(true);
  });

  it('leaves ordinary and TILED_SPARSE images and their client unchanged', () => {
    const parts = createParts().map(part => ({
      ...part,
      DimensionOrganizationType: 'TILED_SPARSE',
    }));
    const ordinary = { ...createParts()[0], ConcatenationUID: undefined };
    const images = [ordinary, ...parts];
    const retrieve = jest.fn();
    const client = { retrieveInstanceFrames: retrieve };

    const prepared = prepareConcatenations(images, client);

    expect(prepared.images).toBe(images);
    expect(prepared.retrieveInstanceFrames).toBe(retrieve);
    expect(client.retrieveInstanceFrames).toBe(retrieve);
  });

  it('passes requests for stored instances through unchanged', async () => {
    const retrieve = jest.fn().mockResolvedValue([]);
    const client = { retrieveInstanceFrames: retrieve };
    const { retrieveInstanceFrames } = prepareConcatenations(createParts(), client);
    const options = request([1], '1.2.3.12');

    await retrieveInstanceFrames(options);

    expect(retrieve).toHaveBeenCalledWith(options);
    expect(retrieve.mock.calls[0][0]).toBe(options);
  });

  it('keeps concatenations at different resolutions separate', async () => {
    const retrieve = jest.fn().mockResolvedValue([]);
    const client = { retrieveInstanceFrames: retrieve };
    const lowerResolution = createParts().map(part => ({
      ...part,
      SOPInstanceUID: `${part.SOPInstanceUID}.1`,
      SOPInstanceUIDOfConcatenationSource: '1.2.3.20',
      ConcatenationUID: '1.2.5',
      Rows: 128,
      Columns: 128,
      TotalPixelMatrixRows: 256,
      TotalPixelMatrixColumns: 384,
    }));

    const { images, retrieveInstanceFrames } = prepareConcatenations(
      [...lowerResolution, ...createParts()],
      client
    );
    await retrieveInstanceFrames(request([4], '1.2.3.20'));

    expect(images).toHaveLength(2);
    expect(retrieve).toHaveBeenCalledWith(request([1], '1.2.3.12.1'));
  });

  it('preserves per-frame groups and keeps pixel data on the stored parts', () => {
    const parts = createParts().map(part => ({
      ...part,
      PixelData: [new ArrayBuffer(1)],
      PerFrameFunctionalGroupsSequence: Array.from(
        { length: Number(part.NumberOfFrames) },
        (_, i) => ({
          FrameContentSequence: {
            DimensionIndexValues: [part.ConcatenationFrameOffsetNumber + i + 1],
          },
        })
      ),
    }));

    const {
      images: [image],
    } = prepareConcatenations(parts, { retrieveInstanceFrames: jest.fn() });

    expect(image.PerFrameFunctionalGroupsSequence).toEqual(
      parts.flatMap(part => part.PerFrameFunctionalGroupsSequence)
    );
    expect(image).not.toHaveProperty('PixelData');
    expect(parts[0].PixelData).toHaveLength(1);
  });

  it.each([
    ['a missing part', [0, 2]],
    ['a missing first part', [1, 2]],
    ['overlapping parts', [0, 0, 2]],
  ])('rejects %s before changing the client', (_description, indices: number[]) => {
    const parts = createParts();
    const retrieve = jest.fn();
    const client = { retrieveInstanceFrames: retrieve };

    expect(() =>
      prepareConcatenations(
        indices.map(index => parts[index]),
        client
      )
    ).toThrow('Incomplete or inconsistent microscopy concatenation');
    expect(client.retrieveInstanceFrames).toBe(retrieve);
  });

  it('rejects a frame outside the concatenation without making a server request', async () => {
    const retrieve = jest.fn();
    const client = { retrieveInstanceFrames: retrieve };
    const { retrieveInstanceFrames } = prepareConcatenations(createParts(), client);

    await expect(retrieveInstanceFrames(request([7]))).rejects.toThrow(
      'Frame 7 is outside microscopy concatenation'
    );
    expect(retrieve).not.toHaveBeenCalled();
  });
});

import { getOhifWriterHeader } from './getOhifWriterHeader';

describe('getOhifWriterHeader', () => {
  const env = { ...process.env };

  afterEach(() => {
    process.env = { ...env };
  });

  it('writes each version as a DICOM LO value of 64 characters or fewer, and unknown for a missing version', () => {
    process.env.VERSION_NUMBER = `3.14.0-beta.64-${'x'.repeat(80)}`;

    const { SoftwareVersions } = getOhifWriterHeader('dcmjs', 'dcmjs', undefined);

    expect(SoftwareVersions[0]).toHaveLength(64);
    expect(SoftwareVersions[0].startsWith('OHIF 3.14.0-beta.64-')).toBe(true);
    expect(SoftwareVersions[1]).toBe('dcmjs unknown');
  });
});
